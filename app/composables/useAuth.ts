export const useAuth = () => {
  const { searchQuery: q, isLoggedIn, userName } = useAuthState();

  async function logout() {
    isLoggedIn.value = null; // 쿠키 삭제
    userName.value = null; // 쿠키 삭제
    q.value = null; // 쿠키 삭제
  }

  async function login() {
    // TODO: 서버 붙이면 여기 활성화
    // await $fetch("/api/auth/login", { method: "POST", body: { email: email.value, password: password.value } });
  }

  async function loginWithGoogle(){
      // TODO: OAuth는 백엔드/리다이렉트 필요. 일단 버튼만.
  // await navigateTo("/api/auth/google"); // 예시
  }


  return { logout, login, googleLogin: loginWithGoogle };
};
