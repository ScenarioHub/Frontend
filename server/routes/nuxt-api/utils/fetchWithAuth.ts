import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";
import type { ApiError, ApiResponse, RefreshData } from "~/types";

export const fetchWithAuth = async <T>(
  event: H3Event,
  url: string,
  options: Parameters<typeof $fetch>[1] = {}, // $fetch 옵션 타입 추론
): Promise<T> => {
  const config = useRuntimeConfig();

  const accessToken = getCookie(event, "auth_access_token");
  const refreshToken = getCookie(event, "auth_refresh_token");

  // 내부 헬퍼: 실제 요청 보내기
  const sendRequest = (token: string | undefined) => {
    return $fetch<T>(url, {
      ...options,
      headers: {
        // ...options.headers, // 토큰 외 다른 속성 있는가?
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  try {
    // [1차 시도]
    console.log("API refresh 1차 시도");
    return await sendRequest(accessToken);
  } catch (error) {
    const err = error as ApiError;
    if (err.statusCode === 401 && refreshToken) {
      try {
        console.log("🔄 [Server] 토큰 만료 감지 -> 갱신 시도");

        const refreshResponse = await $fetch<ApiResponse<RefreshData>>(`${config.apiBase}/api/auth/refresh/`, {
          method: "POST",
          body: { refresh: refreshToken },
        });

        const newAccessToken = refreshResponse.message?.access;
        if (!newAccessToken) {
          throw new Error("새 토큰을 받아오지 못했습니다.");
        }

        const cookieOptions = {
          maxAge: 60 * 60, // 1시간 (useAuthState와 동일)
          path: "/", // [핵심] 이거 없으면 경로 꼬여서 무한루프 돔
          secure: false, // useAuthState와 동일
          sameSite: "lax" as const, // useAuthState와 동일
          httpOnly: false, // useAuthState와 동일 (false여야 JS가 읽음)
        };

        deleteCookie(event, "auth_access_token", cookieOptions);
        setCookie(event, "auth_access_token", newAccessToken, cookieOptions);

        console.log("✅ [Server] 토큰 갱신 성공 -> 재요청\n");
        // [2차 시도]
        return await sendRequest(newAccessToken);
      } catch (refreshError) {
        console.error("❌ [Server] 리프레시 토큰도 만료됨");
        // 여기서 에러를 던지면 프론트에서 로그아웃 처리 등을 할 수 있음
        throw refreshError;
      }
    }
    // 401이 아니거나 리프레시 토큰 없으면 원래 에러 던짐
    throw error;
  }
};
