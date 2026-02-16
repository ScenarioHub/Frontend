import { defineEventHandler } from "h3";
import type { ApiResponse, DataWithJobIdResponse } from "~/types";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);

  const jobId = query.jobId as string || "";
  try {
    const res = await fetchWithAuth<ApiResponse<DataWithJobIdResponse>>(
      event,
      `${config.apiBase}/api/generator/${encodeURIComponent(jobId)}/contents`, {
        method: "GET",
        // query: {
        //   job_uuid: jobId,
        // },
      },
    );
    return res.message;
  } catch (error) {
    console.error("[Upload Data Get API Error]", error);
    return error;
  }
});
