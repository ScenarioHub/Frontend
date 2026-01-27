export interface ScenarioBase {
  id: number;
  title: string;
  createdAt: string;
  tags: string[];
  stats: PostStats;
  uploader: Uploader;
  isBookmarked: boolean;
};

export interface ScenarioItem extends ScenarioBase { // 시나리오 공유 게시물 화면, 각 아이템
  description: string;
};

export interface ScenarioDetail extends Omit<ScenarioItem, "uploader"> { // 시나리오 상세보기 화면
  code: string;
  file: FileInfo;

  // 여기 api 이름 수정==========================================
  uploader: {
    name: string;
    uploader_id: number;
    email: string;
    totalScenarios: number; // 업로드한 사니리오
  };
};

export interface MyScenarioItem { // 내 시나리오 목록
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  downloadCount: number;
};

export interface Uploader { // 업로더
  name: string;
  uploader_id: number;
}

export interface FileInfo {
  format: string;
  version: string;
  size: string;
}

export interface PostStats {
  downloads: number;
  views: number;
  likes: number;
};

// upload 에서 쓰는 것들
export interface ScenarioUploadForm { // 시나리오 업로드시 사용 자료구조
  scenarioId?: string; // 수정 시 존재, 신규 생성 시 없음
  title: string; // 게시글 제목
  description: string; // 게시글 설명
  tags: string[]; // 태그 배열 (예: ["야간", "비"])
  file: File | null; // 실제 업로드할 .xosc 파일

  // 생성기(Generator)에서 넘어온 경우 필요한 추가 정보
  videoUrl?: string; // 시뮬레이션 결과 영상 URL
  tempId?: string; // 생성 단계에서 임시 저장된 시나리오 ID가 있다면
};

// explore 에서 쓰는 것들
export interface PaginatedResponse<T> { // 페이지화
  items: T[]; // 실제 데이터 리스트
  total: number; // 전체 개수
  page?: number; // (선택) 현재 페이지
  pageSize?: number; // (선택) 페이지당 개수
};

export interface Post {
  posts: ScenarioItem[];
  totalPages: number;
  currentPage: number;
  // totalCount: number;
  sort: string;
}
