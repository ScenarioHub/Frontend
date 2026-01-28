import { defineEventHandler } from "h3";
import type { ApiResponse, Post } from "~/types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);

  const page = Number(query.page) || 1;
  const bookmarked = query.bookmarked || false;
  // const page_size = 12;
  const sortString = String(query.sort) || "popular";
  const token = getCookie(event, "auth:token");

  try {
    const response = await $fetch<ApiResponse<Post>>(
      `${config.apiBase}/api/scenarios/explore`,
      {
        method: "get",
        query: {
          page: page,
          // page_size: page_size,
          bookmarked: bookmarked,
          sort: sortString,
        },
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      },
    );

    return response.message;
  } catch (error) {
    console.error("[Explore API Error]", error);
    return {
      items: [],
    };
  }
});
