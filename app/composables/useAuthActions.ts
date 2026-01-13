export const useAuthActions = () => {
  const { searchQuery: q, isLoggedIn, userName } = useAuthState();
  const { close } = useAuthModal();

  function handleLoginSuccess() {
    close();
  }

  function handleSignUpSuccess() {
    close();
  }

  async function logout() {
    isLoggedIn.value = null;
    userName.value = null;
    q.value = null;
  }

  return { handleLoginSuccess, handleSignUpSuccess, logout };
};
