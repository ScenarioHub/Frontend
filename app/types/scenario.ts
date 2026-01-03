// /types/scenario.ts
export type ScenarioBase = {
  id: string;
  title: string;
  createdAt: string;
  tags: string[];
  stats: {
    downloads: number;
    views: number;
    likes: number;
  };
  uploader: {
    name: string;
    initials: string;
  };
  isBookmarked: boolean;
};

export type ScenarioItem = ScenarioBase & { // 시나리오 공유 허브 화면, 각 아이템
  description: string;
};

export type ScenarioDetail = Omit<ScenarioBase, "uploader"> & { // 시나리오 상세보기 화면
  description: string;
  code: string;
  file: {
    format: string;
    version: string;
    size: string;
  };
  uploader: {
    name: string;
    initials: string;
    totalScenarios: number; // 업로더의 사니리오 총 업로드 개수
  };
};

export type MyScenarioItem = { // 내 시나리오 목록
  id: string;
  title: string;
  summary: string;
  createdAt: string; // ISO string
  downloadCount: number;
};

export type PaginatedResponse<T> = {
  items: T[]; // 실제 데이터 리스트
  total: number; // 전체 개수
  page?: number; // (선택) 현재 페이지
  pageSize?: number; // (선택) 페이지당 개수
};

export type MyProfile = {
  id: string;
  email: string;
  name: string;
  initials: string;
  postCount: number; // 내가 올린 게시물 수
  joinedAt: string; // 가입일 (ISO String)
};

export type ScenarioUploadForm = {
  scenarioId?: string; // 수정 시 존재, 신규 생성 시 없음
  title: string; // 게시글 제목
  description: string; // 게시글 설명
  tags: string[]; // 태그 배열 (예: ["야간", "비"])
  file: File | null; // 실제 업로드할 .xosc 파일

  // 생성기(Generator)에서 넘어온 경우 필요한 추가 정보
  videoUrl?: string; // 시뮬레이션 결과 영상 URL
  tempId?: string; // 생성 단계에서 임시 저장된 시나리오 ID가 있다면
};
