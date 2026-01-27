import { defineEventHandler } from "h3";
import type { ApiResponse, ScenarioItem } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const page_size = 12;
  try {
    const response = await $fetch<ApiResponse<ScenarioItem[]>>(
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
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        createdAt: item.createdAt,

        stats: {
          downloads: item.stats.downloads ?? 0,
          views: item.stats.views ?? 0,
          likes: item.stats.likes ?? 0,
        },

        uploader_info: {
          uploader_name: item.uploader_info.uploader_name ?? "Unknown",
          uploader_id: item.uploader_info.uploader_id ?? 0,
        },

        tags: item.tags,
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
