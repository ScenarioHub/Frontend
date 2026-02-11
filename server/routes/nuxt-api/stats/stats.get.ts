import type { ApiResponse, IndexStats } from "~/types";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  try {
    const res = await $fetch<ApiResponse<IndexStats>>(
      `${config.apiBase}/api/scenarios/stats/`, {
        method: "GET",
      },
    );
    return res.message;
  } catch (error) {
    console.error("Stats API 요청 실패:", error);
  }
});
