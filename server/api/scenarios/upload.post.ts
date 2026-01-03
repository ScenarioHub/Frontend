// server/api/scenarios/upload.post.ts
import { createError, defineEventHandler, readMultipartFormData } from "h3";

export default defineEventHandler(async (event) => {
  // 1. Multipart Form Data 읽기
  const body = await readMultipartFormData(event);

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "잘못된 요청입니다 (No body)",
    });
  }

  // 2. 데이터 파싱 (FormData 필드 찾기 헬퍼 함수)
  const getField = (name: string) => body.find((f) => f.name === name);

  // 필수 필드 추출 (toString으로 버퍼 변환)
  const title = getField("title")?.data.toString();
  const description = getField("description")?.data.toString();
  const tagsJson = getField("tags")?.data.toString();

  // 선택 필드 추출
  const file = getField("file");
  const videoUrl = getField("videoUrl")?.data.toString();
  const scenarioIdStr = getField("scenarioId")?.data.toString(); // 수정 시 ID

  // 유효성 검사
  if (!title || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: "필수 항목(제목, 설명)이 누락되었습니다.",
    });
  }

  // 태그 파싱 (JSON 문자열 -> 배열)
  let tags: string[] = [];
  try {
    tags = tagsJson ? JSON.parse(tagsJson) : [];
  } catch (e) {
    console.warn("태그 파싱 실패:", e);
    tags = [];
  }

  // 3. 파일 처리 (S3/로컬 저장소 업로드 시뮬레이션)
  let fileUrl = "";
  let fileName = "";
  let fileSize = 0;
  // const fileFormat = "";

  if (file && file.filename) {
    fileName = file.filename;
    fileSize = file.data.length;
    // fileFormat = "OpenSCENARIO"; // .xosc 확장자 체크 등을 추가할 수 있음

    // TODO: 실제 파일 저장 로직 구현 (AWS S3, R2 등)
    // const uploaded = await uploadToStorage(fileName, file.data);
    // fileUrl = uploaded.url;

    // (임시) 예시 URL 생성
    fileUrl = `/uploads/${Date.now()}_${fileName}`;

    console.log(`[File] 수신됨: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);
  } else if (!scenarioIdStr && !file) {
    // 신규 생성인데 파일이 없는 경우 에러 처리 (선택사항)
    // throw createError({ statusCode: 400, statusMessage: "시나리오 파일이 필요합니다." });
  }

  // 4. DB 트랜잭션 처리 (가상 로직)
  // 실제 구현 시: prisma.$transaction([...]) 등으로 묶어서 처리
  console.log("=== 업로드 데이터 처리 ===");
  console.log("Title:", title);
  console.log("Desc:", description);
  console.log("Tags:", tags);
  console.log("Scenario ID (Update?):", scenarioIdStr || "New Insert");
  console.log("Video URL:", videoUrl);
  console.log("File URL:", fileUrl);

  // (1) Scenarios 테이블 저장/업데이트
  // if (scenarioIdStr) { UPDATE ... } else { INSERT ... }

  // (2) Posts 테이블 저장/업데이트
  // INSERT INTO posts (title, description, ...) VALUES (...)

  // (3) Tags & Scenario_Tags 테이블 저장
  // 태그 존재 여부 확인 후 INSERT -> 매핑 테이블 INSERT

  // (임시) DB에 저장 후 생성된 Post의 ID를 반환한다고 가정
  // 실제로는 DB insert 후 반환된 id를 사용해야 함
  const savedPostId = scenarioIdStr ? parseInt(scenarioIdStr) : Date.now();

  // 5. 결과 반환
  return {
    success: true,
    id: savedPostId, // 프론트엔드에서 상세 페이지 이동을 위해 ID 반환
    message: scenarioIdStr ? "시나리오가 수정되었습니다." : "시나리오가 업로드되었습니다.",
  };
});
