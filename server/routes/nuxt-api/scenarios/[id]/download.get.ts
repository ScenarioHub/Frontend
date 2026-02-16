import { defineEventHandler, getRouterParam, sendStream, setResponseHeaders } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Scenario ID is required" });
  }

  try {
    // 1. 요청 설정 변경 (blob -> stream)
    const response = await $fetch.raw(
      `${config.apiBase}/api/board/${encodeURIComponent(id)}/download/`,
      {
        method: "GET", // 명시적으로 GET 적어줌
        responseType: "stream", // 여기가 핵심입니다! 메모리에 담지 않고 스트림으로 받음
      },
    );

    const originalDisposition = response.headers.get("content-disposition");

    // 2. 헤더 설정 (작성하신 코드 그대로 유지)
    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };

    if (originalDisposition) {
      // 외부 서버가 파일명을 줬으면, 그대로
      headers["Content-Disposition"] = originalDisposition;
    } else {
      // 외부 서버가 파일명을 안 줬을 때만 이름 설정
      headers["Content-Disposition"] = `attachment; filename="scenario_${id}.xosc"`;
    }

    setResponseHeaders(event, headers);

    // 3. 응답 반환 변경 (_data -> sendStream)
    // response.body가 바로 데이터가 흐르는 '호스(Stream)'입니다.
    // 이걸 클라이언트한테 그대로 연결해줍니다.
    return sendStream(event, response.body as ReadableStream);
  } catch (error) {
    console.error("[Download API Error]", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to download file" });
  }
});
