import { defineEventHandler } from "h3";
import type { ApiResponse, ViewerData } from "~/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const scenarioId = getRouterParam(event, "scenarioId") as string;

  try {
    const res = await fetchWithAuth<ApiResponse<ViewerData>>(
      event,
      `/api/scenarios/${scenarioId}/viewer`,
      {
        method: "GET",
      },
    );
    console.log(res.message);
    return res.message;
  } catch (error) {
    console.error("[Viewer.get.ts API Error]", error);
    return {
      items: [],
    };
  }
});
