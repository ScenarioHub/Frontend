export const useAuthActions = () => {
  const { q, isLoggedIn, userName } = useHeaderState();
  const { close } = useAuthModal();

  function applyLogin(payload: { userName?: string }) {
    isLoggedIn.value = true;
    userName.value = payload.userName ?? "U";
    close();
  }

  function applySignedUp(payload: { userName?: string }) {
    isLoggedIn.value = true;
    userName.value = payload.userName ?? "U";
    close();
  }

  async function logout() {
    isLoggedIn.value = null;
    userName.value = null;
    q.value = null;
  }

  return { applyLogin, applySignedUp, logout };
};
