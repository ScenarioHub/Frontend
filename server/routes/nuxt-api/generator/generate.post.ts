import { defineEventHandler } from "h3";
import type { ApiError, ApiResponse, GenerateResponse } from "~/types";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: "요청 본문이 비어있습니다." });
    }

    const { description, mapId } = body;

    const generateResponse = await fetchWithAuth<ApiResponse<GenerateResponse>>(
      event,
      "api/generator/generate/",
      {
        method: "POST",
        body: {
          description: description,
          // mapId 수정하시오.
          mapId: mapId,
        },
      });
    return generateResponse;
  } catch (error: unknown) {
    console.error("생성 API 연동 실패:", error);

    // 에러 타입 단언
    const err = error as ApiError;
    throw createError({
      statusCode: 400,
      statusMessage: err.statusMessage || "시나리오 생성 중 오류 발생",
      data: err.data || err.message,
    });
  }
});
