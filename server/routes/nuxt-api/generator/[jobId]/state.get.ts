import { defineEventHandler } from "h3";
import type { ApiError, ApiResponse, GenerateStateResponse } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const jobId = event.context.params?.jobId;

  try {
    const res = await fetchWithAuth<ApiResponse<GenerateStateResponse>>(
      event,
      `${config.apiBase}/api/generator/${jobId}/state`, {
        method: "GET",
      },
    );
    return res;
  } catch (error) {
    const err = error as ApiError;
    console.error("[jobId State API Error]", err.message);
    return error;
  }
});
