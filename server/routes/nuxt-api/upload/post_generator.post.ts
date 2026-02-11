import { createError, defineEventHandler, readMultipartFormData } from "h3";
import type { ApiError } from "~/types";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  try {
    const body = await readMultipartFormData(event);

    if (!body) {
      throw createError({ statusCode: 500, statusMessage: "요청 본문이 비어있습니다." });
    }

    // 2. 외부 API로 보낼 FormData 객체 생성
    const formData = new FormData();

    // 필드 찾기 헬퍼 함수
    const findField = (name: string) => body.find((f) => f.name === name);

    // [데이터 매핑]
    const title = findField("title");
    const tags = findField("tags");
    const jobId = findField("jobId");

    // 필수값 검증
    if (!title || !jobId) {
      throw createError({ statusCode: 500, statusMessage: "필수 데이터(제목, jobId) 누락" });
    }
    formData.append("jobId", jobId.data.toString());
    formData.append("title", title.data.toString());

    if (tags) {
      formData.append("tags", tags.data.toString());
    }

    // 3. 파일 처리
    const externalResponse = await fetchWithAuth(
      event,
      `${config.apiBase}/api/upload/from_generation/`, {
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
