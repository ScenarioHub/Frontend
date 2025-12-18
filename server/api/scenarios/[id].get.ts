type ScenarioDetail = {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  code: string;
  tags: string[];
  stats: { downloads: number; views: number; likes: number };
  file: { format: string; version: string; size: string };
  uploader: { name: string; email: string; initials: string; totalScenarios: number };
};

const DB: Record<string, ScenarioDetail> = {
  s1: {
    id: "s1",
    title: "도심 주행 시나리오",
    createdAt: "2024-03-15T00:00:00.000Z",
    description:
      "복잡한 도심 환경에서 차량/보행자/신호가 혼재된 상황을 재현하여 인지 및 주행 안정성을 테스트합니다.",
    tags: ["도심", "신호", "차선변경", "보행자"],
    stats: { downloads: 245, views: 3421, likes: 89 },
    file: { format: "OpenSCENARIO 1.0", version: "1.2.0", size: "12.4 KB" },
    uploader: {
      name: "김민수",
      email: "s1@example.com",
      initials: "KM",
      totalScenarios: 12,
    },
    code: `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="0" date="2024-03-15T10:00:00" description="도심 주행 시나리오" author="김민수"/>
  <ParameterDeclarations>
    <ParameterDeclaration name="EgoVehicleSpeed" parameterType="double" value="30.0"/>
    <ParameterDeclaration name="TrafficDensity" parameterType="int" value="8"/>
  </ParameterDeclarations>
</OpenSCENARIO>`,
  },

  s2: {
    id: "s2",
    title: "고속도로 합류",
    createdAt: "2024-03-14T00:00:00.000Z",
    description:
      "고속도로 진입 램프에서 본선 차량 흐름을 고려해 가감속 및 안전한 합류를 수행하는 상황을 테스트합니다.",
    tags: ["고속도로", "합류", "가감속", "안전거리"],
    stats: { downloads: 189, views: 2104, likes: 57 },
    file: { format: "OpenSCENARIO 1.0", version: "1.2.0", size: "18.7 KB" },
    uploader: {
      name: "이서연",
      email: "seoyeon.lee@example.com",
      initials: "SY",
      totalScenarios: 7,
    },
    code: `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="0" date="2024-03-14T10:00:00" description="고속도로 합류" author="이서연"/>
  <ParameterDeclarations>
    <ParameterDeclaration name="EgoVehicleSpeed" parameterType="double" value="80.0"/>
    <ParameterDeclaration name="MergeGap" parameterType="double" value="25.0"/>
  </ParameterDeclarations>
</OpenSCENARIO>`,
  },
};

export default defineEventHandler((event): ScenarioDetail => {
  const id = event.context.params?.id || ""; // /api/scenarios/:id [web:99]

  const found = DB[id];
  if (!found) {
    // 더 엄격하게 하려면 createError({ statusCode: 404, statusMessage: 'Not found' })로 던져도 됨
    return {
      id,
      title: "알 수 없는 시나리오",
      createdAt: new Date().toISOString(),
      description: "존재하지 않는 시나리오입니다.",
      tags: [],
      stats: { downloads: 0, views: 0, likes: 0 },
      file: { format: "-", version: "-", size: "-" },
      uploader: { name: "-", email: "-", initials: "-", totalScenarios: 0 },
      code: "",
    };
  }

  return found;
});
