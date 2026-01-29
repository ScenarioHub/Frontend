import { defineEventHandler, getCookie } from "h3";
import type { ApiResponse, RefreshData } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const refresh = getCookie(event, "auth_refresh_token");

  try {
    const refreshResponse = await $fetch<ApiResponse<RefreshData>>(
      `${config.apiBase}/api/auth/refresh/`,
      {
        method: "POST",
        body: {
          refresh: refresh,
        },
      });
    console.log(`[refresh.post.ts] : ${refreshResponse.message?.access}`);
    return refreshResponse.message?.access;
  } catch (error: unknown) {
    console.error("토큰갱신 API 연동 실패:", error);
    // 401 invalid or expired refresh token
  }
});
