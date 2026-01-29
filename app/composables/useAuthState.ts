// composables/useHeaderState.ts
export const useAuthState = () => {
  const searchQuery = useCookie<string | null>("header:q", {
    default: () => "",
    watch: true,
  });

  const isLoggedIn = computed(() => !!accessToken.value);

  const userName = useCookie<string | null>("auth_userName", {
    default: () => "",
    watch: true,
  });

  const refreshToken = useCookie<string | null>("auth_refresh_token", {
    maxAge: 60 * 60 * 24, // 하루 동안 쿠키 유지
    watch: true,
    secure: false,
    sameSite: "lax",
    httpOnly: false,
  });

  const accessToken = useCookie<string | null>("auth_access_token", {
    maxAge: 60 * 60, // 1시간 동안 쿠키 유지
    default: () => null,
    watch: true,
    secure: false,
    sameSite: "lax",
    httpOnly: false, // 자바스크립트 접근 불가 설정.
    // 만약 클라이언트에서 'Authorization: Bearer...' 헤더를 직접 붙여야 한다면 false로 해야 JS에서 읽을 수 있음.
  });

  return { searchQuery, isLoggedIn, userName, accessToken, refreshToken };
};
