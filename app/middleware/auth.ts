export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn } = useAuthState();

  // 로그인이 true가 아니면 홈으로
  if (isLoggedIn.value !== true) {
    return navigateTo("/"); // 반드시 return [web:37]
  }
});
