export const useAuthModal = () => {
  const isOpen = useState<boolean>("ui:authModalOpen", () => false);
  const mode = useState<"login" | "signup">("ui:authModalMode", () => "login");

  function openLogin() {
    mode.value = "login";
    isOpen.value = true;
  }
  function openSignup() {
    mode.value = "signup";
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }

  return { isOpen, mode, openLogin, openSignup, close };
};
