// composables/useHeaderState.ts
export const useAuthState = () => {
  const searchQuery = useCookie<string | null>("header:q", {
    default: () => "",
    watch: true,
  });
  const isLoggedIn = useCookie<boolean | null>("auth:isLoggedIn", {
    default: () => false,
    watch: true,
  });
  const userName = useCookie<string | null>("auth:userName", {
    default: () => "",
    watch: true,
  });

  return { searchQuery, isLoggedIn, userName };
};
