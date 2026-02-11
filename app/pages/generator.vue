<template>
  <div>
    <div v-if="isProgressOpen" class="p-backdrop">
      <div class="p-modal" role="dialog" aria-modal="true" aria-label="시나리오 생성 중">
        <div class="p-spinner" aria-hidden="true" />
        <div class="p-title">시나리오 생성 중</div>
        <div class="p-sub">{{ currentStepText }}</div>

        <!-- 최근 로그 (선택사항) -->
        <!-- <div v-if="statusLines.length" class="p-logs">
          <div v-for="(line, i) in statusLines.slice(-2)" :key="i" class="p-log-item">
            {{ line }}
          </div>
        </div> -->
      </div>
    </div>

    <!-- page wrapper는 layout에서 하니까, 여기서는 내용만 -->
    <div class="stepbar">
      <div class="steps">
        <div class="step" :class="{ 'is-active': currentStep === 1 }">
          <span class="step-num">1</span>
          <span class="step-text">1단계: 입력</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="step" :class="{ 'is-active': currentStep === 2 }">
          <span class="step-num">2</span>
          <span class="step-text">2단계: 생성 중</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="step" :class="{ 'is-active': currentStep === 3 }">
          <span class="step-num">3</span>
          <span class="step-text">3단계: 생성 완료</span>
        </div>
      </div>
    </div>

    <main class="main">
      <section class="grid">
        <!-- 자연어 입력 div -->
        <article class="panel panel-input">
          <div class="panel-head">
            <span class="pill">자연어 입력</span>
          </div>

          <p class="panel-sub">시나리오 설명을 입력하세요</p>

          <textarea
            v-model="description"
            class="textarea"
            placeholder="예: 차량이 좌회전 중 보행자를 만나는 상황"
            :disabled="uiState === 'done' || uiState === 'running'"
          />
          <div
            class="map-slider-section"
            :class="{ 'is-disabled': uiState === 'done' || uiState === 'running' }"
          >
            <p class="panel-sub">맵 선택 (프리뷰)</p>

            <swiper
              :slides-per-view="1"
              :space-between="15"
              :centered-slides="true"
              :centered-slides-bounds="true"
              :loop="isLoopEnabled"
              :pagination="{ clickable: true }"
              :navigation="true"
              :modules
              class="mySwiper"
              @swiper="onSwiper"
              @slide-change="onSlideChange"
            >
              <swiper-slide v-for="map in maps" :key="map.id">
                <!-- 슬라이드 전체 컨테이너 -->
                <div class="slide-container">
                  <!-- 1. 이미지 박스 (여기에 제목과 화살표가 들어감) -->
                  <div class="image-box">
                    <img
                      :src="map.imageUrl || 'https://via.placeholder.com/600x300/e2e8f0/1e293b?text=Map+Preview'"
                      alt="Map Preview"
                      class="slide-img"
                    >

                    <!-- 2. 맵 이름 (좌측 상단 오버레이) -->
                    <div class="map-name-badge">
                      {{ map.name }}
                    </div>
                  </div>

                  <!-- 3. 맵 설명 (박스 아래) -->
                  <div class="map-description">
                    {{ map.description }}
                  </div>
                </div>
              </swiper-slide>
            </swiper>
            <div v-if="uiState === 'done' || uiState === 'running'" class="disabled-overlay" />
          </div>
          <button
            :class="uiState === 'done' ? 'btn-reset' : 'btn-primary'"
            @click="uiState === 'done' ? onReset() : onGenerate()"
          >
            {{ uiState === "done" ? "초기화 (새로 만들기)" : "시나리오 생성하기" }}
          </button>
        </article>

        <!-- 결과 div -->

        <article class="panel">
          <div class="panel-head">
            <span class="pill pill-dark">시뮬레이터 화면</span>
          </div>

          <p class="panel-sub">시나리오 대기 중</p>

          <div class="sim-viewport">
            <template v-if="uiState === 'done' && videoUrl">
              <video
                v-if="uiState === 'done' && videoUrl"
                ref="videoEl"
                class="video"
                :src="videoUrl"
                autoplay
                muted
                playsinline
                controls
              />
            </template>
            <template v-else>
              <div>
                <div class="wait-icon" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="wait-car"
                  >
                    <path
                      d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
                    />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <div class="sim-text">
                  <div class="sim-title">시뮬레이터 준비 완료</div>
                  <div class="sim-desc">
                    시나리오를 생성하면 여기에 표시됩니다
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="sim-actions">
            <div class="btn-row">
              <!-- 추가된 업로드 버튼 -->
              <button
                class="btn btn-blue"
                :disabled="currentStep !== 3"
                @click="onGoToUploadForm"
              >
                <svg
                  class="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span class="btn-text">커뮤니티 공유하기</span>
              </button>

              <!-- 기존 다운로드 버튼 -->
              <button
                class="btn btn-green"
                :disabled="currentStep !== 3"
                @click="onDownload"
              >
                <svg
                  class="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 15V3" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                <span class="btn-text">다운로드 (.xosc)</span>
              </button>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<!-- f5나 웹 껐을 떄의 대응
 취소(1번 정책):
    새로고침/이탈 시 취소하려면 서버는 jobId 기반으로 “취소 가능한 작업”이어야 하고,
    인터럽트/취소 플래그 체크가 들어가야 실제로 멈춥니다

SSE는 구독/작업 분리: job 생성은 POST, 진행률은 SSE로 구독(재접속 가능) 구조가 안정적입니다

autoplay는 실패할 수 있음:
    자동재생은 브라우저 정책으로 막힐 수 있어서 play() Promise reject를 대비하고,
    막히면 사용자가 controls로 재생하게 두면 됩니다.
 -->

<!--
서버(jobId 기준)는 최소 4개의 상태를 나눠두면 프론트가 깔끔해집니다.

gpt_generating : GPT로 .xosc 생성 중(진행률 모달)
xosc_ready : .xosc 생성 완료 → 이때 다운로드 버튼 활성화
stream_ready : HLS의 index.m3u8가 생성되고 최초 세그먼트가 붙기 시작 → 모달 닫고 video 재생 시작
stream_ended : 시뮬 종료 → FFmpeg 종료 + 플레이리스트에 #EXT-X-ENDLIST가 최종적으로 붙게(또는 event playlist로 마무리)

server-sent events (progress 진행률 실시간 전송)
video js 라이브러리 사용
서버에서 m3u8

서버에서
사용자의 코드 -> gpt로 시나리오 코드 -> (실행) 동영상 추출 ->
-->

<!--
설명문(복붙용, API 포함)
프로젝트 목표는 “자연어 입력 → 서버에서 GPT로 OpenSCENARIO(.xosc) 생성 → esmini로 시뮬레이션 실행 → 영상은 HLS(3~10초 지연 허용)로 스트리밍 → 웹에서 라이브처럼 재생”이다. mp4 완성본을 다 만들고 전송하면 시뮬 길이만큼(예: 1분) 추가 대기가 생겨 UX가 나쁘므로, 서버가 시뮬을 돌리는 동시에 FFmpeg로 HLS 세그먼트를 생성해 클라이언트가 몇 초 후 바로 재생을 시작하게 만들고 싶다.

상태 머신(클라 UX)
서버는 jobId 단위로 상태를 관리하고, 클라에서는 모달 진행률 + 버튼 활성화 타이밍을 아래처럼 제어한다.

gpt_generating: GPT로 xosc 생성 중(모달 진행률 표시)

xosc_ready: xosc 생성 완료 → xosc 다운로드 버튼 즉시 활성화

stream_ready: HLS playlist(m3u8)와 초기 세그먼트가 준비됨 → 모달 닫고 <video> 라이브 재생 시작

stream_ended: 시뮬 종료 → 라이브 재생 종료(playlist가 더 이상 갱신되지 않거나 ENDLIST 처리)

API 엔드포인트(초안)
Job 생성

POST /api/scenarios

body: { prompt: string }

response: 201 Created + { jobId: string } (또는 Location 헤더로 job 리소스 제공)

진행률/상태 SSE

GET /api/scenarios/{jobId}/events

response: Content-Type: text/event-stream

서버는 event: + data: 형태로 JSON을 계속 push (예: percent/message/state/urls)

예시 data: { state: "xosc_ready", percent: 25, message: "...", xoscUrl: "..." }

xosc 다운로드

GET /api/scenarios/{jobId}/xosc

xosc_ready 이후 다운로드 가능

응답은 파일 다운로드(attachment) 또는 presigned URL 리다이렉트

HLS 스트림 제공(playlist/segments)

GET /api/scenarios/{jobId}/hls/index.m3u8

GET /api/scenarios/{jobId}/hls/{segment}.ts (또는 fMP4 세그먼트)

클라이언트는 stream_ready 이후 index.m3u8를 재생한다. HLS는 m3u8(매니페스트)이 세그먼트(.ts 등) 목록을 가리키는 구조라서, 라이브는 플레이리스트가 계속 갱신된다.

(옵션) 취소(새로고침/이탈 시 무조건 취소 정책)

DELETE /api/scenarios/{jobId}

서버의 실행 중 작업(esmini/ffmpeg)을 중단하고 리소스를 정리

클라이언트 동작 요약
사용자가 “생성 시작” 클릭 → POST /api/scenarios로 jobId 받음 → GET /api/scenarios/{jobId}/events SSE 연결 → gpt_generating 동안 모달 진행률 표시.

SSE에서 xosc_ready 수신 즉시 다운로드 버튼 활성화.

SSE에서 stream_ready 수신 즉시 video에 HLS(m3u8) 붙여 재생 시작(Chrome/Firefox는 hls.js 사용 고려, Safari는 네이티브 가능).

SSE에서 stream_ended 수신하면 UI를 3단계 완료로 바꾸고, 라이브 재생 종료 처리.
 -->

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

import { useRouter } from "vue-router"; // [web:router_push]

import type SwiperType from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import type { ApiResponse, GenerateResponse, GenerateStateResponse, MapItem, ServerState } from "~/types";

const modules = [Pagination, Navigation];

const { openLogin } = useAuthModal();
const { isLoggedIn } = useAuthState();

type UiState = "idle" | "running" | "done" | "error";

// 1=입력, 2=생성중, 3=완료
type Step = 1 | 2 | 3;

const description = ref("");
const uiState = ref<UiState>("idle");
const currentStep = ref<Step>(1);
const downloadUrl = ref<string>("");

const jobId = ref<string | null>(null);
const currentStepText = ref("");
const statusLines = ref<string[]>([]);
const stateText = ref("AI가 시나리오를 분석하고 있습니다");
const videoUrl = ref<string | null>(null);
const resultScenarioId = ref<number | null>(null);
resultScenarioId.value = 1; // eslint 오류 방지용 코드 : 나중에 밑에서 선언하면 삭제 할 코드임========================================
let pollInterval: NodeJS.Timeout | null = null;
const POLL_INTERVAL = 500; // 0.5초마다 확인

// const isProgressModalOpen = computed(() => uiState.value === "running");
const isProgressOpen = ref(false);
const selectedMapId = ref<number | null>(null);
const router = useRouter();

const isLoopEnabled = computed(() => maps.value.length > 1);

const maps = ref<MapItem[]>([]);

// 상태별 메시지 매핑
const getStateTextByState = (state: ServerState): string => {
  switch (state) {
    case "pending":
      return "서버 준비 중...";
    case "running":
      return "AI가 시나리오를 생성하고 있습니다";
    case "done":
      return "시나리오 생성 완료!";
    default:
      return "상태를 확인 중입니다";
  }
};

onMounted(() => {
  fetchMaps();
});

async function fetchMaps() {
  try {
    const data = await $fetch<MapItem[]>("/nuxt-api/maps/list");

    if (data && Array.isArray(data)) {
      maps.value = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: `/nuxt-api/maps/preview?id=${item.id}`,
      }));
    }
  } catch (err) {
    console.error("fetchMaps 에러:", err);
  }
}

const onSwiper = (swiper: SwiperType) => {
  if (maps.value.length > 0) {
    const map = maps.value[swiper.realIndex];
    if (map) {
      selectedMapId.value = map.id;
    }
  }
};
const onSlideChange = (swiper: SwiperType) => {
  const index = swiper.realIndex;
  if (maps.value[index]) {
    selectedMapId.value = maps.value[index].id;
  }
};
function onGoToUploadForm() {
  if (currentStep.value !== 3 || !jobId.value) return;

  if (!isLoggedIn.value) {
    openLogin();
    return;
  }

  // ID만 쿼리 스트링으로 전달 (예: /upload?scenarioId=105)
  router.push({
    path: "/upload",
    query: { jobId: jobId.value },
  });
}

async function onGenerate() {
  // 초기화
  currentStep.value = 2;
  uiState.value = "running";
  jobId.value = null;
  statusLines.value = ["시나리오 생성을 시작합니다"];
  videoUrl.value = null;

  isProgressOpen.value = true;
  stateText.value = "요청을 준비 중입니다...";
  try {
    const res = await $fetch<ApiResponse<GenerateResponse>>("/nuxt-api/generator/generate", {
      method: "POST",
      body: {
        description: description.value,
        mapId: 5,
        // mapId: selectedMapId.value,
      },
    });
    jobId.value = res.message?.jobId as string;
    stateText.value = getStateTextByState(res.message?.state as ServerState);
    currentStepText.value = getStateTextByState("pending");
    statusLines.value = ["서버에 요청을 보냈습니다", stateText.value];
    // console.log("🔄 폴링 시작:", res.message?.state);
    startPolling();
  } catch (error) {
    console.error("생성 요청 실패:", error);
    isProgressOpen.value = false;
    uiState.value = "error";
    currentStep.value = 1;
    stateText.value = "요청 중 오류가 발생했습니다";
  }
}
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log("🛑 폴링 중단");
  }
}

function onDownload() {
  if (currentStep.value !== 3) return;
  window.location.href = downloadUrl.value;
}

async function startPolling() {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(async () => {
    if (!jobId.value) return;

    try {
      const res = await $fetch<ApiResponse<GenerateStateResponse>>(`/nuxt-api/generator/${jobId.value}/state`);
      const msg = res.message;
      // console.log("✅ 상태 수신:", msg?.state);

      // 상태 업데이트
      currentStepText.value = getStateTextByState(msg?.state as ServerState);

      // 완료 체크
      if (msg?.state === "done") {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        setTimeout(() => {
          handleDoneState(msg);
          return;
        }, 500);
        return;
      }
    } catch (error) {
      console.error("❌ 폴링 에러:", error);
      // 30초 연속 실패시 중단
    }
  }, POLL_INTERVAL);
}
function handleDoneState(state: GenerateStateResponse) {
  // console.log("🎉 완료!\n", state);
  currentStepText.value = getStateTextByState("done");
  currentStep.value = 3;

  uiState.value = "done";

  isProgressOpen.value = false;

  downloadUrl.value = `/nuxt-api/scenarios/${state.scenarioId}/download`;
  videoUrl.value = state.scenarioId ? `/nuxt-api/scenarios/${state.scenarioId}/video` : null;
}

onBeforeUnmount(() => {
  stopPolling();
});

function onReset() {
  stopPolling();
  isProgressOpen.value = false;

  description.value = "";
  uiState.value = "idle";
  currentStep.value = 1;

  jobId.value = null;
  stateText.value = "AI가 시나리오를 분석하고 있습니다";
  statusLines.value = [];
  videoUrl.value = null;
  downloadUrl.value = "";
  currentStepText.value = "준비 중";
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
}

.stepbar {
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.steps {
  max-width: 980px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  justify-content: center;
  gap: 10px;
  align-items: center;
}
.step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  color: #334155;
  font-weight: 700;
  font-size: 13px;
}
.step.is-active {
  background: #2f6dff;
  color: #fff;
}
.step-num {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.25);
}
.step-arrow {
  color: #94a3b8;
  font-weight: 700;
}

.main {
  max-width: 1600px; /* 980px -> 1280px */
  margin: 0 auto;
  padding: 16px 32px;
}
@media (max-width: 900px) {
  .main {
    padding: 18px 14px 12px; /* 모바일에서는 더 타이트 */
  }
}
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.panel {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.panel-input {
  display: flex;
  flex-direction: column;
  /* 오른쪽 패널과 비슷한 높이를 원하면 최소 높이도 줄 수 있음 */
  min-height: 600px;
}

.panel-head {
  margin-bottom: 12px;
}

.panel-input .panel-head,
.panel-input .panel-sub {
  flex: 0 0 auto;
}

.panel-input .textarea {
  flex: 1 1 auto; /* 남는 높이 전부 사용 */
  min-height: 0; /* flex에서 overflow/축소 이슈 방지에 도움 */
  height: auto; /* 기존 height: 280px 무력화 */
}

.panel-input .btn-primary {
  flex: 0 0 auto; /* 버튼은 아래에 고정 */
  margin-top: 16px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: #2f6dff;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}
.pill-dark {
  background: #0f172a;
}

.panel-sub {
  margin: 6px 0 14px;
  color: #334155;
  font-weight: 700;
}

.textarea {
  width: 100%;
  height: 180px;
  border-radius: 14px;
  border: 2px solid rgba(47, 109, 255, 0.35);
  padding: 14px;
  outline: none;
  resize: none;
  font-size: 14px;
  background: #fff;
  margin-bottom: 20px;
}
.textarea:focus {
  box-shadow: 0 0 0 3px rgba(47, 109, 255, 0.12);
}
.textarea:disabled {
  background: #f1f5f9; /* 연한 회색 배경 */
  color: #64748b;      /* 흐릿한 글자색 */
  cursor: not-allowed;
  border-color: rgba(15, 23, 42, 0.1);
}

.btn-primary {
  width: 100%;
  margin-top: 16px;
  height: 54px;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  background: #155dfc;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
  transition: all 0.2s; /* 부드러운 색 전환 효과 추가 */
}

/* 새로 추가: 초기화 버튼 스타일 (회색/은색) */
.btn-reset {
  width: 100%;
  margin-top: 16px;
  height: 54px;
  border-radius: 14px;
  cursor: pointer;
  background: #7c3aed;     /* 배경 흰색 */
  color: #fff;       /* 글자 회색 */
  font-weight: 800;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: #6d28d9;  /* 마우스 올리면 연한 회색 */
}

.sim-box {
  margin-top: 10px;
  height: 360px;
  border-radius: 16px;
  border: 2px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 18px;
}
.sim-actions {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.btn {
  width: 100%;
  height: 56px; /* h-14 느낌 */
  border: 0;
  border-radius: 10px; /* rounded-md 느낌 */
  font-size: 18px; /* text-lg 느낌 */
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease,
    transform 0.05s ease;
}

.btn-primary:hover {
  background: #1d4ed8; /* blue-700 */
}

/* 초록 버튼 */
.btn-green {
  background: #16a34a; /* green-600 */
  color: #fff;
}
.btn-green:hover {
  background: #15803d; /* green-700 */
}

/* disabled(3단계 전, 초기화 후 포함) */
.btn:disabled {
  background: #cbd5e1; /* 회색 */
  color: #475569;
  opacity: 1; /* 흐릿해 보이기 싫으면 1 */
  cursor: not-allowed;
  pointer-events: none; /* hover/클릭 차단 */
}

/* 아이콘 크기 */
.icon {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
}
.btn-text {
  line-height: 1;
}
.wait-icon {
  width: 128px;
  height: 128px;
  margin: 0 auto 32px;
  background: #e5e7eb;
  border-radius: 18px;
  display: grid;
  place-items: center;
}
.wait-car {
  color: #9ca3af;
}
.sim-viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto; /* 비율에 따라 자동 */
  border-radius: 16px;
  border: 2px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.sim-title {
  font-weight: 900;
  text-align: center;
  color: #334155;
  margin-bottom: 6px;
}
.sim-desc {
  color: #64748b;
  font-weight: 600;
  font-size: 13px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .sim-box {
    height: 320px;
  }
}
.p-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.p-modal {
  width: min(460px, 92vw);
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
  padding: 22px;
  text-align: center;
}

.p-spinner {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 4px solid rgba(47, 109, 255, 0.18);
  border-top-color: #2f6dff;
  margin: 6px auto 14px;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.p-title {
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 6px;
}
.p-sub {
  color: #64748b;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 14px;
}

.p-row {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-weight: 800;
  font-size: 12px;
  margin-bottom: 8px;
}

.p-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  overflow: hidden;
}
.p-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #111827, #2f6dff);
  width: 0%;
  transition: width 0.1s linear;
}

.btn-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-row .btn {
    min-width: 0;
}

.btn-blue {
  background: #2f6dff;
  color: #fff;
}
.btn-blue:hover {
  background: #1d4ed8;
}

/* 모바일 대응: 화면이 좁을 때는 위아래로 배치 */
@media (max-width: 600px) {
  .btn-row {
    flex-direction: column;
  }
  .btn-row .btn:first-child,
  .btn-row .btn:last-child {
    flex: 1 1 auto;
    width: 100%;
  }
}

.btn-row .btn:first-child {
  flex: 7;
}

.btn-row .btn:last-child {
  flex: 3;
}
.panel-input {
  min-height: 600px;
  max-width: 100%;
  overflow: hidden;
}

.map-slider-section {
  width: 100%;
  margin-bottom: 20px;
  position: relative;
}

.map-slider-section.is-disabled {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.5);
}
.disabled-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: transparent;
  cursor: not-allowed;
  pointer-events: auto;
}
.mySwiper {
  width: 100%;
  overflow: visible;
}

.slide-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.map-name-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(136, 134, 134, 0.85);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.map-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  min-height: 1.5em;
  max-width: 90%;
  padding: 0 4px;
  align-self: center;
  font-weight: 500;
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
    width: 40px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0);
    border-radius: 50%; /* 원형 */
    color: #2f6dff; /* 화살표 색상 */
    transition: all 0.2s ease;

    top: 40%;
    transform: translateY(-50%);
    margin: 0;
    z-index: 20;
}

:deep(.swiper-button-prev) {
  left: 12px;
}

:deep(.swiper-button-next) {
  right: 12px;
}

:deep(.swiper-button-prev:after),
:deep(.swiper-button-next:after) {
  font-size: 18px;
  font-weight: 900;
}

:deep(.swiper-button-prev:hover),
:deep(.swiper-button-next:hover) {
  transform: translateY(-50%) scale(1.15); /* 살짝 커짐 */
}

/* 페이지네이션 (점) 위치 */
:deep(.swiper-pagination) {
  bottom: 64px;
}

:deep(.swiper-pagination-bullet) {
  background: #ffffff;
  opacity: 0.8;
}

:deep(.swiper-pagination-bullet-active) {
  background: #2f6dff;
  opacity: 1;
}
</style>
