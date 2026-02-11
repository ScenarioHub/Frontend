export interface Generate { // 내 아이디 정보
  description: string; // 내가 올린 게시물 수
  mapId: number; // 가입일 (ISO String)
};

export interface GenerateResponse {
  jobId: string;
  state: string;
}

export interface GenerateStateResponse extends GenerateResponse {
  scenarioId: number;
  mapId: number;
}

export type ServerState = "pending" | "running" | "done" | "error";
