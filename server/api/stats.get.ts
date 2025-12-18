export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  // (A) 지금은 서버 없으니 더미
  if (!config.apiBase) {
    return {
      sharedScenarios: 0,
      activeUsers: 0,
      totalDownloads: 0,
    };
  }

  // return await $fetch("/stats", { baseURL: config.apiBase });
  return {
    sharedScenarios: 4321,
    activeUsers: 825100,
    totalDownloads: 4510200,
  };
});
