// composables/useHeaderState.ts
export const useHeaderState = () => {
  const q = useCookie<string | null>("header:q", {
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

  return { q, isLoggedIn, userName };
};
