// server/routes/nuxt-api/[...path].get.ts
export default defineEventHandler(async (event) => {
  const path = event.context.params?.path as string; // "contents/..."
  const config = useRuntimeConfig();

  const base = config.public.apiBase.replace(/\/+$/, ""); // https://scenariohub.cloud
  const url = `${base}/api/${path}`; // https://scenariohub.cloud/api/contents/...

  const res = await $fetch.raw<ArrayBuffer>(url, { responseType: "arrayBuffer" });

  // 상태/헤더 그대로 전달
  setResponseStatus(event, res.status);
  for (const [k, v] of Object.entries(res.headers)) {
    if (v) setHeader(event, k, v as string);
  }

  // ArrayBuffer를 그대로 body로 넘기기
  const buffer = res._data; // ArrayBuffer
  if (!buffer) {
    // 백엔드에서 바디를 못 받은 경우
    return "";
  }
  return new Uint8Array(buffer); // 또는 그냥 buffer 리턴도 가능
});
