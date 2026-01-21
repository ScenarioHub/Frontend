import { createError, defineEventHandler, getQuery, sendStream } from "h3";
import type { Readable } from "node:stream";
// fetch로 이미지 바이너리를 받기 위해 필요

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const mapId = query.id;

  if (!mapId) {
    throw createError({ statusCode: 400, message: "Map ID is required" });
  }

  try {
    // 1. 백엔드 API로 이미지 요청
    // (responseType: 'arrayBuffer' 또는 'stream'으로 받아야 함)
    const backendRes = await $fetch.raw(
      `${config.apiBase}/api/maps/preview`,
      {
        query: { id: mapId }, // 쿼리 파라미터 전달
        responseType: "stream", // 스트림으로 받기
      },
    );

    // 2. 백엔드 응답이 성공(200 OK)인지 확인
    if (!backendRes.ok || !backendRes.body) {
      throw createError({ statusCode: backendRes.status, message: "Failed to fetch image from backend" });
    }

    // 3. 백엔드에서 받은 Content-Type 헤더를 그대로 클라이언트에 전달 (image/png 등)
    const contentType = backendRes.headers.get("content-type") || "image/png";
    event.node.res.setHeader("Content-Type", contentType);

    // 캐싱을 위한 헤더 추가 (선택사항 - 브라우저 캐시 활성화)
    event.node.res.setHeader("Cache-Control", "public, max-age=86400"); // 1일 캐시

    // 4. 스트림 파이핑 (Node.js ReadableStream -> H3 Response)
    // $fetch.raw의 body는 ReadableStream(Web API) 또는 Node.js Stream일 수 있음
    return sendStream(event, backendRes.body as unknown as Readable);
  } catch (error) {
    console.error(`[Preview API Error] MapID: ${mapId}`, error);
    throw createError({ statusCode: 500, message: "Internal Server Error while fetching image" });
  }
});
