import { defineEventHandler } from "h3";
import type { ApiError, ApiResponse, GenerateStateResponse } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, "jobId") as string;

  try {
    const res = await fetchWithAuth<ApiResponse<GenerateStateResponse>>(
      event,
      `/api/generator/${jobId}/state`, {
        method: "GET",
      },
    );
    // console.log("[State] ", res.message?.state);
    return res;
  } catch (error) {
    const err = error as ApiError;
    console.error("[jobId State API Error]", err.message);
    return error;
  }
});
