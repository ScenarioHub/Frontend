import { createError, defineEventHandler, readMultipartFormData } from "h3";
import type { ApiError } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const jobId = getRouterParam(event, "jobId") as string;

  try {
    const body = await readMultipartFormData(event);

    if (!body) {
      throw createError({ statusCode: 500, statusMessage: "요청 본문이 비어있습니다." });
    }

    const formData = new FormData();

    const findField = (name: string) => body.find((f) => f.name === name);
    const title = findField("title");
    const tags = findField("tags");

    if (!title || !jobId) {
      throw createError({ statusCode: 500, statusMessage: "필수 데이터(제목, jobId) 누락" });
    }
    formData.append("title", title.data.toString());

    if (tags) {
      formData.append("tags", tags.data.toString());
    }

    const externalResponse = await fetchWithAuth(
      event,
      `${config.apiBase}/api/generator/${jobId}/upload/`, {
        method: "POST",
        body: formData,
      },
    );
    return externalResponse;
  } catch (error: unknown) {
    console.error("외부 API 연동 실패:", error);

    const err = error as ApiError;

    throw createError({
      statusCode: 500,
      statusMessage: err.statusMessage || "외부 서버 업로드 중 오류 발생",
      data: err.data || err.message,
    });
  }
});
