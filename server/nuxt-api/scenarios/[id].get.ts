import type { ScenarioDetail } from "~/types/scenario";

type ServerResponseData = Omit<ScenarioDetail, "id" | "file"> & {
  id: number; // 프론트는 string이지만 서버는 number
  file: {
    format: string;
    version: string;
    size: number; // 프론트는 string("100KB")이지만 서버는 number(100)
  };
};

// API 전체 응답 구조
interface ApiResponse {
  status: number;
  message: ServerResponseData;
}

export default defineEventHandler(async (event): Promise<ScenarioDetail> => {
  const id = event.context.params?.id || "";
  const config = useRuntimeConfig(event);
  try {
    const response = await $fetch<ApiResponse>(
      `${config.apiBase}/api/scenario-detail/${id}/`,
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
      id: String(data.id),
      isBookmarked: data.isBookmarked ?? false,
      file: {
        format: data.file?.format ?? "-",
        version: data.file?.version ?? "-",
        size: `${data.file?.size ?? 0}KB`, // number -> string 변환
      },
      uploader: {
        name: data.uploader?.name ?? "Unknown",
        initials: data.uploader?.initials ?? "U",
        totalScenarios: data.uploader?.totalScenarios ?? 0,
      },
    };

    return scenario;
  } catch (error) {
    console.error("[API Error]", error);

    // 에러 시 Fallback
    return {
      id,
      title: "로드 실패",
      createdAt: new Date().toISOString(),
      description: "데이터를 불러오는 중 오류가 발생했습니다.",
      tags: [],
      stats: { downloads: 0, views: 0, likes: 0 },
      file: { format: "-", version: "-", size: "-" },
      uploader: { name: "-", initials: "-", totalScenarios: 0 },
      code: "",
      isBookmarked: false,
    } as ScenarioDetail;
  }
});
