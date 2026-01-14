import { createError, defineEventHandler, readBody } from "h3";

// 에러 객체 인터페이스 (upload.post.ts와 통일)
interface ApiError {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
  data?: unknown;
}

// 응답 데이터 인터페이스
interface RegisterResponse {
  status: number;
  message: {
    id: string;
    email: string;
    initials: string;
  } | string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    // 1. 프론트엔드로부터 JSON 데이터 읽기
    // (Content-Type: application/json)
    const body = await readBody(event);

    if (!body) {
      throw createError({ statusCode: 400, statusMessage: "요청 본문이 비어있습니다." });
    }

    const { email, password, name } = body;

    // 필수값 검증 (간단한 체크)
    if (!email || !password || !name) {
      throw createError({
        statusCode: 400,
        statusMessage: "필수 정보(이메일, 비밀번호, 이름)가 누락되었습니다.",
      });
    }

    // 2. 외부 백엔드 API로 전송 (JSON)
    const externalResponse = await $fetch<RegisterResponse>(`${config.apiBase}/api/auth/register/`, {
      method: "POST",
      body: {
        email,
        password,
        name,
      },
      // 필요 시 헤더 추가
      // headers: { 'Authorization': ... }
    });

    // 3. 성공 응답 반환 (200 OK)
    // 외부 API가 200이면 그대로 리턴
    return externalResponse;
  } catch (error: unknown) {
    console.error("회원가입 API 연동 실패:", error);

    // 에러 타입 단언 및 Nuxt 에러 객체 생성
    const err = error as ApiError; // $fetch 에러 객체 접근을 위해 any 사용

    throw createError({
      statusCode: 500,
      statusMessage: err.statusMessage || "외부 서버 업로드 중 오류 발생",
      data: err.data || err.message, // 상세 에러 메시지 포함
    });
  }
});
