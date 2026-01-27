import type { ApiResponse, ScenarioDetail } from "@/types";

export default defineEventHandler(async (event): Promise<ScenarioDetail> => {
  const id = event.context.params?.id || "";
  const config = useRuntimeConfig(event);

  try {
    const response = await $fetch<ApiResponse<ScenarioDetail>>(
      `${config.apiBase}/api/scenarios/${id}/details/`,
    );

    const data = response.message;

    if (!data) {
      throw new Error("API 응답에 message 필드가 없습니다.");
    }

    // 2. 매핑 (타입 불일치 해결)
    const scenario: ScenarioDetail = {
      // 기존 속성들을 먼저 다 복사 (title, description, code, tags, stats 등)
      ...data,

      // [덮어쓰기] 타입이 다른 필드만 직접 변환
      id: data.id,
      isBookmarked: data.isBookmarked ?? false,
      file: {
        format: data.file?.format ?? "-",
        version: data.file?.version ?? "-",
        size: data.file?.size ?? "-",
      },
      uploader: {
        name: data.uploader?.name ?? "Unknown",
        uploader_id: data.uploader?.uploader_id ?? 0,
        email: data.uploader?.email ?? "Unknown email",
        totalScenarios: data.uploader?.totalScenarios ?? 0,
      },
    };

    return scenario;
  } catch (error) {
    console.error("[API Error]", error);

    // 에러 시 Fallback
    return {
      id: 0,
      title: "로드 실패",
      createdAt: new Date().toISOString(),
      description: "데이터를 불러오는 중 오류가 발생했습니다.",
      tags: [],
      stats: { downloads: 0, views: 0, likes: 0 },
      file: { format: "-", version: "-", size: "KB" },
      uploader: { name: "-", uploader_id: 0, email: "", totalScenarios: 0 },
      code: "",
      isBookmarked: false,
    } as ScenarioDetail;
  }
});
