import { defineEventHandler } from "h3";
import type { ApiResponse, Post } from "~/types";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);

  const page = Number(query.page) || 1;
  const liked = query.onlyLiked || false;
  // const page_size = 12;
  const sortString = String(query.sort) || "popular";

  try {
    const externalResponse = await fetchWithAuth<ApiResponse<Post>>(
      event,
      `${config.apiBase}/api/board/explore`, {
        method: "GET",
        query: {
          page: page,
          // page_size: page_size,
          isLiked: liked,
          sort: sortString,
        },
      },
    );
    return externalResponse.message;
  } catch (error) {
    console.error("[Explore API Error]", error);
    return {
      items: [],
    };
  }
});
