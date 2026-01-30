import type { ApiResponse, LoginResponseData, User } from "~/types";

export const useAuth = () => {
  const { searchQuery, userName, accessToken, refreshToken } = useAuthState();

  async function register(payload: { email: string; password: string; name: string }) {
    try {
      // const response =
      await $fetch<ApiResponse<User>>("/nuxt-api/auth/register/", {
        method: "POST",
        body: payload,
      });
      // console.log("회원가입 성공:", response);
      await login({ email: payload.email, password: payload.password });
    } catch (error) {
      console.error("Register Failed inside useAuth:", error);

      // 서버(register.post.ts)에서 createError로 던진 data는 error.data에 들어있습니다.
      // 예: error.data.message => "이미 존재하는 이메일입니다."
      throw error;
    }
  }

  async function logout() {
    try {
      await $fetch<ApiResponse<string>>("/nuxt-api/auth/logout/", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout Failed:", error);
      throw error;
    } finally {
      userName.value = null; // 쿠키 삭제
      accessToken.value = null;
      refreshToken.value = null;
      searchQuery.value = null; // 쿠키 삭제
    }
  }

  async function login(payload: { email: string; password: string }) {
    try {
      const res = await $fetch<ApiResponse<LoginResponseData>>("/nuxt-api/auth/login/", {
        method: "POST",
        body: payload,
      });
      // console.log("로그인 성공 in useAuth.ts:", res);
      accessToken.value = res.message?.access as string | null;
      refreshToken.value = res.message?.refresh as string | null;
      userName.value = res.message?.user.name || "사용자";
    } catch (error) {
      console.error("Login Failed:", error);
      throw error;
    }
  }

  return { logout, login, register, userName };
};
