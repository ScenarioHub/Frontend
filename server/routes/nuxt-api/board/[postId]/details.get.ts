import type { ApiResponse, ScenarioDetail } from "@/types";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default defineEventHandler(async (event): Promise<ScenarioDetail> => {
  const postId = getRouterParam(event, "postId") as string;

  try {
    const res = await fetchWithAuth<ApiResponse<ScenarioDetail>>(
      event,
      `/api/board/${postId}/details/`,
      {
        method: "GET",
      },
    );
    const data = res.message;

    if (!data) {
      throw new Error("API 응답에 message 필드가 없습니다.");
    }
    // 2. 매핑 (타입 불일치 해결)
    const scenario: ScenarioDetail = {
      ...data,
      postId: data.postId,
      isLiked: data.isLiked ?? false,
      file: {
        format: data.file?.format ?? "-",
        version: data.file?.version ?? "-",
        size: data.file?.size ?? "-",
      },
      uploader: {
        name: data.uploader?.name ?? "Unknown",
        uploaderid: data.uploader?.uploaderid ?? 0,
        email: data.uploader?.email ?? "Unknown email",
        totalScenarios: data.uploader?.totalScenarios ?? 0,
      },
    };
    return scenario;
  } catch (error) {
    console.error("[API Error]", error);

    // 에러 시 Fallback
    return {
      postId: 0,
      title: "로드 실패",
      createdAt: new Date().toISOString(),
      description: "데이터를 불러오는 중 오류가 발생했습니다.",
      tags: [],
      stats: { downloads: 0, views: 0, likes: 0 },
      file: { format: "-", version: "", size: 0 },
      uploader: { name: "-", uploaderid: 0, email: "", totalScenarios: 0 },
      code: "",
      isOwner: false,
      isLiked: false,
      scenarioId: 0,
    } as ScenarioDetail;
  }
});
