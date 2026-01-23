import type { IndexStats } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const stats: IndexStats = {
    sharedScenarios: 0,
    activeUsers: 0,
    totalDownloads: 0,
  };

  // (A) 지금은 서버 없으니 더미
  if (!config.apiBase) {
    return { sharedScenarios: 1, activeUsers: 2, totalDownloads: 3 };
  }

  // return await $fetch("/stats", { baseURL: config.apiBase });
  stats.sharedScenarios = 2026;
  stats.activeUsers = 1;
  stats.totalDownloads = 24;
  return stats;
});
