export interface ApiError<T = unknown> {
  statusCode?: number;
  statusMessage?: string;
  status?: number;
  message?: string;
  data?: T;
}

// (참고) 만약 정상 응답도 비슷한 구조라면 이렇게 이름 짓기도 합니다.
export interface ApiResponse<T = unknown> {
  status?: number;
  message?: T;
}
export interface Data {
  data?: {
    status?: number;
    message?: string;
  };
}
