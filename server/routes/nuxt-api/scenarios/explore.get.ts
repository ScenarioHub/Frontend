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
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const page_size = 12;

  try {
    const response = await $fetch<ExternalApiResponse>(
      `${config.apiBase}/api/scenarios/explore/`,
      {
        method: "get",
        query: {
          page: page,
          page_size: page_size,
        },
      },
    );

    const externalItems = response.data || [];

    const mappedItems: ScenarioItem[] = externalItems.map((item) => {
      // 태그 문자열 처리 ("55,555" -> ["55", "555"])
      const tagList = item.tags && item.tags.trim() !== ""
        ? item.tags.split(",").map((t) => t.trim())
        : [];

      return {
        id: String(item.id),
        title: item.title,
        description: item.description,
        createdAt: item.createdAt,

        stats: {
          downloads: item.stats_downloads ?? 0,
          views: item.stats_views ?? 0,
          likes: item.stats_likes ?? 0,
        },

        uploader: {
          name: item.uploader_name ?? "Unknown",
          initials: item.uploader_initials ?? "U",
        },

        tags: tagList,
        isBookmarked: item.isBookmarked ?? false,
      };
    });

    return {
      items: mappedItems,
    };
  } catch (error) {
    console.error("[Explore API Error]", error);
    return {
      items: [],
    };
  }
});
