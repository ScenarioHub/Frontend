import { defineEventHandler } from "h3";
import type { ApiResponse, PostItem, ScenarioItem } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const page_size = 12;
  try {
    const response = await $fetch<ApiResponse<PostItem[]>>(
      `${config.apiBase}/api/scenarios/explore/`,
      {
        method: "get",
        query: {
          page: page,
          page_size: page_size,
        },
      },
    );
    const externalItems = response.message || [];

    const mappedItems: ScenarioItem[] = externalItems.map((item) => {
      // 태그 문자열 처리 ("55,555" -> ["55", "555"])
      const tagList = item.tags && item.tags.trim() !== ""
        ? item.tags.split(",").map((t) => t.trim())
        : [];

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        createdAt: item.createdAt,

        stats: {
          downloads: item.downloads ?? 0,
          views: item.views ?? 0,
          likes: item.likes ?? 0,
        },

        uploader: {
          name: item.uploader_name ?? "Unknown",
          id: item.uploader_id ?? 0,
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
