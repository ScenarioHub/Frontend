import { createError, defineEventHandler, getCookie } from "h3";
import type { ApiError, ApiResponse, Like } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, "auth_access_token");
  const id = getRouterParam(event, "postId") as string;

  try {
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "대상 ID가 누락되었습니다." });
    }
    if (!token) {
      throw createError({ statusCode: 401, statusMessage: "인증 토큰이 없습니다." });
    }

    const externalResponse = await fetchWithAuth<ApiResponse<Like>>(
      event,
      `${config.apiBase}/api/board/${id}/like/`, {
        method: "POST",
      },
    );
    // console.log(`[like.post.ts] ${externalResponse.status}\n${externalResponse.message?.liked}, ${externalResponse.message?.likes}`);
    // 200 이랑 201 둘다 여기로 됨
    return externalResponse;
  } catch (error: unknown) {
    console.error("외부 API 좋아요 요청 실패:", error);

    const err = error as ApiError;

    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "좋아요 처리 중 오류 발생",
      data: err.data || err.message,
    });
  }
});
