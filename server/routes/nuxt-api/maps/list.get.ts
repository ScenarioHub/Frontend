import { defineEventHandler } from 'h3';

// ✅ 백엔드 API에서 오는 실제 데이터 구조 (가정)
interface ServerMapItem {
  id: number;
  map_name: string;
  description: string;
  // 필요하다면 thumbnail_url 등 다른 필드도 있을 수 있음
}

// ✅ 백엔드 응답 래퍼 구조 (detail.get.ts 참고)
interface MapsApiResponse {
  status: number;
  message: ServerMapItem[]; // 배열 형태라고 가정
}

// ✅ 프론트엔드로 보낼 최종 데이터 구조
export interface MapItem {
  id: number;
  name: string;       // map_name -> name 변환
  description: string;
  imageUrl?: string;  // 프론트에서 채울 필드 (여기선 빈 문자열이나 null)
}

export default defineEventHandler(async (event): Promise<MapItem[]> => {
  const config = useRuntimeConfig(event);

  try {
    // 1. 실제 백엔드 API 호출
    const response = await $fetch<MapsApiResponse>(
      `${config.apiBase}/api/maps/list`, // 백엔드 엔드포인트 경로 확인 필요
      {
        // 필요시 헤더 추가 (예: Authorization)
        // headers: { Authorization: ... }
      }
    );

    const data = response.message;

    if (!Array.isArray(data)) {
      console.warn("API 응답 message가 배열이 아닙니다. 빈 배열 반환.");
      return [];
    }

    // 2. 데이터 매핑 (Server -> Client 구조 변환)
    return data.map((item) => ({
      id: item.id,            // 숫자 그대로 유지
      name: item.map_name,    // map_name -> name
      description: item.description,
      imageUrl: "",           // 이미지는 preview API로 따로 받으므로 비워둠
    }));

  } catch (error) {
    console.error("[Maps List API Error]", error);
    // 에러 시 빈 배열 반환하여 프론트가 터지지 않게 처리
    return [];
  }
});
