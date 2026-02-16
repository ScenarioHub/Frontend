import { createError, defineEventHandler, getRouterParam } from "h3";
import type { ApiError, ApiResponse } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth"; // 경로 확인 필요

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = getRouterParam(event, "postId") as string;

  try {
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "삭제할 대상 ID가 누락되었습니다." });
    }

    const externalResponse = await fetchWithAuth<ApiResponse<string>>(
      event,
      `${config.apiBase}/api/board/${id}/delete/`,
      {
        method: "DELETE",
      },
    );

    console.log(`[delete.delete.ts] 삭제 성공: ${id}`);

    return externalResponse;
  } catch (error) {
    console.error("[delete.delete.ts] API 요청 실패:", error);

    const err = error as ApiError;
    if (err.statusCode == 403) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message || "인증 오류",
      });
    }
    if (err.statusCode == 404) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message || "게시물 없음",
      });
    }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "게시물 삭제 처리 중 오류 발생",
    });
  }
});
