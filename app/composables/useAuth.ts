export const useAuth = () => {
  const { q, isLoggedIn, userName } = useHeaderState();

  async function logout() {
    isLoggedIn.value = null; // 쿠키 삭제
    userName.value = null; // 쿠키 삭제
    q.value = null; // 쿠키 삭제
  }

  return { logout };
};
