import { defineEventHandler, getCookie } from "h3";
import type { ApiResponse } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const refresh = getCookie(event, "auth_refresh_token");

  try {
    const logoutResponse = await $fetch<ApiResponse<string>>(
      `${config.apiBase}/api/auth/logout/`,
      {
        method: "POST",
        body: {
          refresh: refresh,
        },
      });
    return logoutResponse;
  } catch (error: unknown) {
    console.error("로그아웃 API 연동 실패:", error);
  }
});
