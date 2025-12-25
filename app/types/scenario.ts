// /types/scenario.ts
export type ScenarioBase = {
  id: string;
  title: string;
  createdAt: string;
  tags: string[];
  stats: { downloads: number; views: number; likes: number };
  uploader: { name: string; initials: string };
};

export type ScenarioItem = ScenarioBase & { // 시나리오 공유 화면, 각 아이템
  description: string;
  isBookmarked: boolean;
};

export type ScenarioDetail = ScenarioBase & { // 시나리오 상세보기 화면
  description: string;
  code: string;
  file: { format: string; version: string; size: string };
  uploader: {
    name: string;
    email: string;
    initials: string;
    totalScenarios: number;
  };
};

export type MyScenarioItem = { // 내 시나리오 목록
  id: string;
  title: string;
  summary: string;
  createdAt: string; // ISO string
  downloadCount: number;
};
