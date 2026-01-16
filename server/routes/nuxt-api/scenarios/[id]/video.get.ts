import { defineEventHandler, getHeader, getRouterParam, sendStream, setResponseHeaders, setResponseStatus } from "h3";

interface ApiError {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
  data?: unknown;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Scenario ID is required" });
  }

  // 1. 클라이언트(브라우저)가 보낸 Range 헤더 가져오기
  // (예: "bytes=0-" 또는 "bytes=1048576-")
  // 비디오 탐색(Seeking)을 위해 필수입니다.
  const range = getHeader(event, "range");

  try {
    // 2. 외부 서버로 요청 보내기 (스트림 모드)
    const response = await $fetch.raw(
      `${config.apiBase}/api/scenarios/${encodeURIComponent(id)}/video/`, // 외부 API 엔드포인트 (상황에 맞춰 수정 필요)
      {
        method: "GET",
        responseType: "stream", // 메모리에 담지 않고 스트림으로 받음
        headers: {
          // 중요: 브라우저가 요청한 Range 정보를 외부 서버에도 그대로 전달해야 합니다.
          ...(range && { Range: range }),
          Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8", // 비디오 요청임을 명시
        },
        // 206(Partial Content) 응답이 와도 에러로 처리하지 않도록 설정
        ignoreResponseError: true,
      },
    );

    // 3. 외부 서버의 응답 헤더를 클라이언트에게 전달
    // 비디오 스트리밍에 필수적인 헤더들을 복사합니다.
    const headers: Record<string, string> = {};

    const contentType = response.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;
    else headers["Content-Type"] = "video/mp4"; // 기본값

    const contentLength = response.headers.get("content-length");
    if (contentLength) headers["Content-Length"] = contentLength;

    const contentRange = response.headers.get("content-range");
    if (contentRange) headers["Content-Range"] = contentRange;

    // 이 헤더가 있어야 브라우저가 "아, 이 서버는 구간 이동(Seeking)이 가능하구나"라고 인식합니다.
    headers["Accept-Ranges"] = "bytes";

    setResponseHeaders(event, headers);

    // 4. 상태 코드 전달 (200 OK 또는 206 Partial Content)
    setResponseStatus(event, response.status);

    // 5. 스트림 파이핑
    // 외부 서버에서 오는 데이터 호스를 브라우저로 바로 연결
    return sendStream(event, response.body as ReadableStream);
  } catch (error) {
    console.error("[Video Proxy Error]", error);

    const err = error as ApiError;

    // 외부 서버가 404를 준 경우 등을 처리
    if (err.statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: "Video not found" });
    }

    throw createError({ statusCode: 500, statusMessage: "Failed to stream video" });
  }
});
