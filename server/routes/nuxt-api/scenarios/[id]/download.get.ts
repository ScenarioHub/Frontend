import { defineEventHandler, getRouterParam, setResponseHeaders } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Scenario ID is required" });
  }

  try {
    const response = await $fetch.raw(
      `${config.apiBase}/api/scenarios/${encodeURIComponent(id)}/download/`,
      {
        responseType: "blob",
      },
    );
    const originalDisposition = response.headers.get("content-disposition");
    // 내 응답 헤더 설정
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

    return response._data;
  } catch (error) {
    console.error("[Download API Error]", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to download file" });
  }
});
