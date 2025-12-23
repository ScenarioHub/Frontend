// server/api/explore.get.ts
export default defineEventHandler(() => {
  type ScenarioItem = {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    tags: string[];
    uploader: {
      name: string;
      initials: string;
    };
    stats: {
      downloads: number;
      views: number;
      likes: number;
    };
    bookmarked: boolean;
  };

  const base: Omit<ScenarioItem, "id">[] = [
    {
      title: "보행자 돌발 시나리오",
      description:
        "횡단보도에서 보행자가 갑자기 튀어나오는 상황을 테스트합니다. 자율주행 시스템의 긴급 제동 및 회피 능력을 검증하는 시나리오입니다.",
      createdAt: "2024-12-01T09:10:00Z",
      tags: ["보행자", "긴급제동", "도심"],
      uploader: { name: "김민수", initials: "KM" },
      stats: { downloads: 1234, views: 3421, likes: 89 },
      bookmarked: true,
    },
    {
      title: "차선 변경 테스트",
      description:
        "고속도로에서 복수 차량이 동시에 차선을 변경하는 복잡한 상황을 시뮬레이션합니다. 다양한 속도 구간에서의 안전한 차선 변경을 검증합니다.",
      createdAt: "2024-11-20T11:30:00Z",
      tags: ["고속도로", "차선변경", "복잡"],
      uploader: { name: "이서연", initials: "LS" },
      stats: { downloads: 2156, views: 5623, likes: 142 },
      bookmarked: false,
    },
    {
      title: "교차로 좌회전 시나리오",
      description:
        "신호등이 있는 교차로에서 좌회전 시 마주 오는 차량과 보행자를 고려한 안전한 좌회전 수행 여부를 검증하는 시나리오입니다.",
      createdAt: "2024-11-05T08:20:00Z",
      tags: ["교차로", "좌회전", "신호"],
      uploader: { name: "박준호", initials: "PJ" },
      stats: { downloads: 892, views: 2134, likes: 67 },
      bookmarked: false,
    },
    {
      title: "주차장 자동 주차",
      description:
        "복잡한 주차장 환경에서 자동 주차 기능을 테스트합니다. 다른 주차 차량과 보행자를 고려한 자율주행 주차 시나리오입니다.",
      createdAt: "2024-10-10T14:00:00Z",
      tags: ["주차", "저속", "실내"],
      uploader: { name: "정하은", initials: "JH" },
      stats: { downloads: 1567, views: 4231, likes: 103 },
      bookmarked: false,
    },
    {
      title: "어린이 주행 시나리오",
      description:
        "어린이 보호구역에서 다양한 돌발 상황(도로 횡단, 차 사이에서 등장 등)을 포함한 시나리오입니다.",
      createdAt: "2024-09-15T07:45:00Z",
      tags: ["어린이", "안전", "센서"],
      uploader: { name: "최동욱", initials: "CD" },
      stats: { downloads: 2341, views: 6789, likes: 178 },
      bookmarked: true,
    },
    {
      title: "스쿨존 저속 주행",
      description:
        "스쿨존에서 제한 속도를 유지하며 횡단보도, 정차 차량, 보행자를 회피하는 저속 주행 시나리오입니다.",
      createdAt: "2024-08-30T13:15:00Z",
      tags: ["스쿨존", "저속", "보행자"],
      uploader: { name: "강예린", initials: "KY" },
      stats: { downloads: 1098, views: 2876, likes: 91 },
      bookmarked: false,
    },
    {
      title: "우천 시 보행자 돌발 시나리오",
      description:
    "비가 오는 야간 환경에서 우산을 쓴 보행자가 시야가 제한된 횡단보도에 갑자기 진입하는 상황을 테스트합니다. 자율주행 차량의 와이퍼 동작, 제동 거리 증가, 노면 미끄러짐까지 함께 고려하여 긴급 제동 및 회피 능력을 종합적으로 검증하는 시나리오입니다. 인접 차로 차량과의 간섭까지 포함해 실제 도심 주행과 유사한 조건을 재현합니다.",
      createdAt: "2024-12-05T21:15:00Z",
      tags: ["보행자", "우천", "야간", "긴급제동"],
      uploader: { name: "이주현", initials: "JH" },
      stats: { downloads: 1987, views: 5123, likes: 134 },
      bookmarked: true,
    },
    {
      title: "악천후 고속도로 차선 변경 시나리오",
      description:
    "안개와 약한 비가 동시에 존재하는 고속도로 구간에서 여러 대의 차량이 연속적으로 차선을 변경하는 상황을 시뮬레이션합니다. 레이더와 카메라 센서의 감지 거리 감소, 차선 인식 품질 저하, 차량 간 거리 유지 전략까지 종합적으로 검증하여, 차선 변경 의사결정 모듈이 안정적으로 동작하는지 확인하는 시나리오입니다. 정체 구간과 가속 구간이 섞인 현실적인 흐름을 포함합니다.",
      createdAt: "2024-11-18T08:30:00Z",
      tags: ["고속도로", "차선변경", "악천후"],
      uploader: { name: "박가은", initials: "GP" },
      stats: { downloads: 1675, views: 4782, likes: 121 },
      bookmarked: false,
    },
    {
      title: "복합 교차로 좌회전·우회전 혼합 시나리오",
      description:
    "신호등이 여러 개 설치된 복합 교차로에서 좌회전, 우회전, 직진 차량이 동시에 얽히는 상황을 모델링합니다. 보행자 신호와 차량 신호가 어긋나는 경우, 무단횡단 보행자, 자전거 이용자까지 포함하여 자율주행 차량의 경로 계획과 충돌 회피 성능을 검증하는 시나리오입니다. 신호 위반 차량과 느리게 움직이는 차량이 섞인 비정상 패턴도 함께 테스트합니다.",
      createdAt: "2024-10-27T16:45:00Z",
      tags: ["교차로", "좌회전", "우회전", "보행자"],
      uploader: { name: "정윤호", initials: "YH" },
      stats: { downloads: 1432, views: 3890, likes: 97 },
      bookmarked: true,
    },
  ];

  const list: ScenarioItem[] = [];

  for (let i = 0; i < 18; i++) {
    const src = base[i % base.length];

    list.push({
      id: String(i + 1),
      ...src,
      createdAt: new Date(
        new Date(src.createdAt).getTime() - i * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  return { items: list };
});
