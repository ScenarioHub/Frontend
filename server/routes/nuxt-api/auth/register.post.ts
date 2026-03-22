import { createError, defineEventHandler, readBody } from "h3";
import type { ApiError, ApiResponse, User } from "~/types";

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
    const registerResponse = await $fetch<ApiResponse<User>>(`${config.public.apiBase}/api/auth/register/`, {
      method: "POST",
      body: {
        email,
        password,
        name,
      },
    });

    return registerResponse;
  } catch (error: unknown) {
    const err = error as ApiError;

    console.log("================");
    console.error("❌ 회원가입 API 연동 실패:", {
      statusCode: err.statusCode,
      statusMessage: err.statusMessage,
      data: err.data, // 외부 서버의 상세 에러 메시지 (예: "이미 존재하는 이메일")
    });

    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "회원가입 중 오류 발생",
      data: err.data,
    });
  }
});
