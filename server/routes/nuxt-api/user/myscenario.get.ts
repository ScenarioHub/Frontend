import { defineEventHandler } from "h3";
import type { ApiResponse, MyScenarioItem } from "~/types";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  try {
    const res = await fetchWithAuth<ApiResponse<MyScenarioItem[]>>(
      event,
      `${config.apiBase}/api/user/myscenario`, {
        method: "GET",
      },
    );
    return res.message;
  } catch (error) {
    console.error("[My-Scenarios API Error]", error);
    return {
      items: [],
    };
  }
});
