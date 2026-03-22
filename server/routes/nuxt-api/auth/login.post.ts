import { createError, defineEventHandler, readBody } from "h3";
import type { ApiError, ApiResponse, LoginResponseData } from "~/types";

// 실제 백엔드 응답에 맞춰 수정하세요. (토큰, 유저 정보 등)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    // 1. 프론트엔드로부터 JSON 데이터 읽기
    const body = await readBody(event);

    if (!body) {
      throw createError({ statusCode: 400, statusMessage: "요청 본문이 비어있습니다." });
    }

    const { email, password } = body;

    // 필수값 검증
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "이메일과 비밀번호를 모두 입력해주세요.",
      });
    }

    // 2. 외부 백엔드 API로 로그인 요청 전송
    const loginResponse = await $fetch<ApiResponse<LoginResponseData>>(
      `${config.public.apiBase}/api/auth/login/`,
      {
        method: "POST",
        body: {
          email,
          password,
        },
      });

    // 3. 성공 응답 반환 (200 OK)
    return loginResponse;
  } catch (error: unknown) {
    console.error("로그인 API 연동 실패:", error);

    // 에러 타입 단언
    const err = error as ApiError;

    throw createError({
      statusCode: 500,
      statusMessage: err.statusMessage || "외부 서버 업로드 중 오류 발생",
      data: err.data || err.message, // 상세 에러 메시지 포함
    });
  }
});
