import { defineEventHandler } from "h3";
import type { ApiResponse, Post, ScenarioItem } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const page_size = 12;
  const sortString = String(query.sort) || "popular";
  try {
    const response = await $fetch<ApiResponse<Post>>(
      `${config.apiBase}/api/scenarios/explore`,
      {
        method: "get",
        query: {
          page: page,
          page_size: page_size,
          sort: sortString,
        },
      },
    );

    const externalItems = response.message?.posts || [];

    const totalPages = response.message?.totalPages as number;
    const currentPages = response.message?.currentPage as number;
    // const totalCount = response.message?.totalCount
    const sort = response.message?.sort as string;

    const posts: ScenarioItem[] = externalItems.map((item) => {
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

        uploader: {
          name: item.uploader.name ?? "Unknown",
          uploader_id: item.uploader.uploader_id ?? 0,
        },

        tags: item.tags,
        isBookmarked: item.isBookmarked ?? false,
      };
    });
    const returnData: Post = {
      posts: posts,
      totalPages: totalPages,
      currentPage: currentPages,
      // totalCount : totalCount,
      sort: sort,
    };
    return returnData;
  } catch (error) {
    console.error("[Explore API Error]", error);
    return {
      items: [],
    };
  }
});
