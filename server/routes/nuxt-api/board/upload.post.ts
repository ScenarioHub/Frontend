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
    const description = findField("description");
    const tags = findField("tags");
    const scenarioId = findField("id") || findField("scenarioId");
    const mapId = findField("mapId");
    // 필수값 검증
    if (!title || !description) {
      throw createError({ statusCode: 500, statusMessage: "필수 데이터(제목, 설명) 누락" });
    }

    formData.append("title", title.data.toString());
    formData.append("description", description.data.toString());
    if (tags) {
      formData.append("tags", tags.data.toString());
    }

    if (scenarioId) {
      formData.append("scenarioId", scenarioId.data.toString());
    }
    if (mapId) {
      formData.append("mapId", mapId.data.toString());
    }
    // 3. 파일 처리
    const fileField = findField("file");
    if (!fileField) {
      throw createError({ statusCode: 500, statusMessage: "파일이 누락되었습니다." });
    }

    // [수정 포인트 1] Buffer -> BlobPart 타입 호환 문제 해결
    // Node.js Buffer는 BlobPart와 100% 호환되지만 TS 정의상 충돌이 나므로 강제 형변환(as unknown as BlobPart)을 사용합니다.
    const fileBlob = new Blob([fileField.data as unknown as BlobPart], {
      type: fileField.type || "application/octet-stream",
    });

    formData.append("file", fileBlob, fileField.filename);
    const externalResponse = await fetchWithAuth(
      event,
      `${config.apiBase}/api/board/upload/`, {
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
