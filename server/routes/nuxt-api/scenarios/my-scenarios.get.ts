import { defineEventHandler } from "h3";
import type { ApiResponse, MyScenarioItem } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const token = getCookie(event, "auth:token");

  try {
    const res = await $fetch<ApiResponse<MyScenarioItem[]>>(
      `${config.apiBase}/api/scenarios/myscenario`,
      {
        method: "get",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      },
    );
    console.log(res.message);
    return res.message;
  } catch (error) {
    console.error("[My-Scenarios API Error]", error);
    return {
      items: [],
    };
  }
});
