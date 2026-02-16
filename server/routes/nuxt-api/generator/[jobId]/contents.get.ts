import { defineEventHandler } from "h3";
import type { ApiResponse, DataWithJobIdResponse } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const jobId = getRouterParam(event, "jobId") as string;

  try {
    const res = await fetchWithAuth<ApiResponse<DataWithJobIdResponse>>(
      event,
      `${config.apiBase}/api/generator/${jobId}/contents`, {
        method: "GET",
      },
    );
    return res.message;
  } catch (error) {
    console.error("[Upload Data Get API Error]", error);
    return error;
  }
});
