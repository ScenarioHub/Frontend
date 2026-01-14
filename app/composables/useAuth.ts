type RegisterServerResponseData = {
  id: string;
  email: string;
  initials: string;
  user: user;
};
type user = {
  email: string;
  id: number;
  name: string;
};

interface ApiResponse {
  status: number;
  data: RegisterServerResponseData;
}

export const useAuth = () => {
  const { searchQuery: q, isLoggedIn, userName } = useAuthState();

  async function register(payload: { email: string; password: string; name: string }) {
    try {
      const response = await $fetch<ApiResponse>("/api/auth/register/", {
        method: "POST",
        body: payload,
      });
      console.log("회원가입 성공:", response);

      // 회원가입 후 바로 로그인
      isLoggedIn.value = true;
      userName.value = payload.name;
      return response;
    } catch (error) {
      console.error("Register Failed inside useAuth:", error);

      // 서버(register.post.ts)에서 createError로 던진 data는 error.data에 들어있습니다.
      // 예: error.data.message => "이미 존재하는 이메일입니다."

      // 컴포넌트(SignupModal.vue)에서 catch 할 수 있도록 에러를 다시 던집니다.
      // 필요하다면 에러 메시지를 가공해서 던질 수도 있습니다.
      throw error;
    }
  }

  async function logout() {
    isLoggedIn.value = null; // 쿠키 삭제
    userName.value = null; // 쿠키 삭제
    q.value = null; // 쿠키 삭제
  }

  async function login(payload: { email: string; password: string }) {
    try {
      const res = await $fetch<ApiResponse>("/nuxt-api/auth/login/", {
        method: "POST",
        body: payload,
      });
      console.log("로그인 성공:", res);

      isLoggedIn.value = true;
      userName.value = res.data.user.name || "사용자";
    } catch (error) {
      console.error("Login Failed:", error);
      throw error;
    }
  }

  async function loginWithGoogle() {
  // await navigateTo("/api/auth/google"); // 예시
  }

  return { logout, login, googleLogin: loginWithGoogle, register, userName };
};
