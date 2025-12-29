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

export type ScenarioItem = ScenarioBase & { // 시나리오 공유 화면, 각 아이템
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

export type PaginatedResponse<MyScenarioItem> = {
  items: MyScenarioItem[]; // 실제 데이터 리스트
  total: number; // 전체 개수 (페이지네이션용)
};

export type MyProfile = {
  id: string;
  email: string;
  name: string;
  initials: string;
  postCount: number; // 내가 올린 게시물 수
  joinedAt: string; // 가입일 (ISO String)
};
