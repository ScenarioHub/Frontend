import { createError, defineEventHandler, getCookie } from "h3";
import type { ApiError } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, "auth:token");
  const id = getRouterParam(event, "id");

  try {
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "대상 ID가 누락되었습니다." });
    }
    if (!token) {
      throw createError({ statusCode: 401, statusMessage: "인증 토큰이 없습니다." });
    }

    const externalResponse = await $fetch(`${config.apiBase}/api/scenarios/${id}/like/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
