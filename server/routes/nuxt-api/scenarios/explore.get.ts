import { defineEventHandler } from "h3";
import type { ScenarioItem } from "~/types/scenario";

// 1. 외부 API가 주는 데이터 모양 (Source Type)
interface ExternalPostItem {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  stats_downloads: number;
  stats_views: number;
  stats_likes: number;
  uploader_name: string;
  uploader_initials: string;
  tags: string; // "tag1,tag2" 형태의 문자열
  isBookmarked: boolean;
}

interface ExternalApiResponse {
  status: number;
  data: ExternalPostItem[];
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  try {
    // 2. 외부 서버로 요청 (.env에 설정된 주소 사용)
    const response = await $fetch<ExternalApiResponse>(
      `${config.apiBase}/api/scenarios/explore/`,
    );

    const externalItems = response.data || [];

    // 3. 데이터 매핑 (Flat 구조 -> Nested 구조)
    const mappedItems: ScenarioItem[] = externalItems.map((item) => {
      // 태그 문자열 처리 ("55,555" -> ["55", "555"])
      // 빈 문자열일 경우 빈 배열 반환
      const tagList = item.tags && item.tags.trim() !== ""
        ? item.tags.split(",").map((t) => t.trim())
        : [];

      return {
        id: String(item.id), // number -> string
        title: item.title,
        description: item.description,
        createdAt: item.createdAt, // 필요하다면 여기서 new Date(..).toISOString() 변환

        // 평면적인 stats 필드를 객체로 묶기
        stats: {
          downloads: item.stats_downloads ?? 0,
          views: item.stats_views ?? 0,
          likes: item.stats_likes ?? 0,
        },

        // 평면적인 uploader 필드를 객체로 묶기
        uploader: {
          name: item.uploader_name ?? "Unknown",
          initials: item.uploader_initials ?? "U",
        },

        tags: tagList,
        isBookmarked: item.isBookmarked ?? false,
      };
    });

    // 4. 프론트엔드가 기대하는 형태로 반환
    return {
      items: mappedItems,
    };
  } catch (error) {
    console.error("[Explore API Error]", error);
    // 에러 발생 시 빈 리스트 반환하여 화면이 깨지지 않게 처리
    return {
      items: [],
    };
  }
});
