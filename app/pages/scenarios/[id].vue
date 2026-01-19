<template>
  <div>
    <div class="page">
      <!-- 상단바(페이지 전용) -->
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="back-btn"
            type="button"
            aria-label="뒤로가기"
            @click="goBack"
          >
            <!-- 좌상단 화살표 -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <!-- detail이 있을 때만 렌더링 -->
          <div v-if="detail" class="title-wrap">
            <h1 class="title">{{ detail.title || "-" }}</h1>
            <div class="sub">
              <span class="avatar">{{
                (detail.uploader?.initials ?? "U").slice(0, 1)
              }}</span>
              <span class="sub-text">{{ detail.uploader?.name ?? "-" }}</span>
              <span class="dot">•</span>
              <span class="sub-text">{{ formatDate(detail.createdAt) }}</span>
            </div>
          </div>

          <!-- 로딩 중일 때 스켈레톤 (선택) -->
          <div v-else class="title-wrap">
            <h1 class="title">...</h1>
          </div>
        </div>

        <!-- 우상단 버튼들 -->
        <div class="topbar-actions">
          <button
            class="cursor-pointer bg-white border-2 border-gray-200 hover:border-[#155dfc] text-[#0a0a0a] rounded-lg h-10 px-4 flex items-center gap-2 text-[14px]"
            type="button"
            @click="onShare"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-share2 lucide-share-2"
              aria-hidden="true"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </svg>
            공유
          </button>

          <button
            class="cursor-pointer justify-center whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none py-2 has-[>svg]:px-3 bg-[#155dfc] hover:bg-[#1447e6] text-white rounded-lg h-10 px-4 flex items-center gap-2 text-[14px]"
            type="button"
            @click="onDownload"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
              aria-hidden="true"
            >
              <path d="M12 15V3" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
            </svg>
            다운로드
          </button>
          <button
            class="cursor-pointer border-2 bg-white border-gray-200 hover:border-[#fb2c36] rounded-lg size-10 flex items-center justify-center"
            type="button"
            aria-label="좋아요"
            @click="toggleBookmark"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-heart text-[#0a0a0a]"
              aria-hidden="true"
            >
              <path
                d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
              />
            </svg>
          </button>
          <!-- (비로그인 상태)로그인 버튼 -->
          <button
            v-if="isLoggedIn !== true"
            class="btn btn-ghost"
            type="button"
            @click="openLogin"
          >
            <span class="btn-icon" aria-hidden="true" data-v-88d55a61="">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                data-v-88d55a61=""
              >
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  data-v-88d55a61=""
                />
                <circle cx="9" cy="7" r="4" data-v-88d55a61="" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" data-v-88d55a61="" />
                <path d="M16 3.128a4 4 0 0 1 0 7.744" data-v-88d55a61="" />
              </svg>
            </span>
            로그인
          </button>
          <!-- (로그인 상태)사용자 아이콘 -->
          <button
            v-else
            class="my-avatar"
            aria-label="사용자 메뉴"
            @click="onLogoutClick"
          >
            <span class="my-avatar-text">{{ userInitial }}</span>
          </button>
        </div>
      </header>

      <main class="main">
        <div v-if="pending" class="state">불러오는 중...</div>
        <div v-else-if="error || !detail" class="state error">
          데이터를 불러오지 못했습니다.
        </div>

        <div v-else class="grid">
          <!-- 왼쪽 컬럼 -->
          <section class="left">
            <!-- 시뮬레이션 영상 자리(더미) -->
            <div class="video-card">
              <video
                controls
                preload="metadata"
                class="simulation-player"
                :src="videoSrc"
              >
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
            </div>

            <!-- 설명 -->
            <div class="panel">
              <div class="panel-title">설명</div>
              <p class="panel-body">{{ detail.description }}</p>
            </div>

            <!-- 코드(탭 제거, 글씨 버튼/이벤트 제거) -->
            <div class="panel">
              <div class="panel-title">
                <span class="code-label">
                  <!-- 아이콘은 제공해준 코드 아이콘 사용 -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-code"
                    aria-hidden="true"
                  >
                    <path d="m16 18 6-6-6-6" />
                    <path d="m8 6-6 6 6 6" />
                  </svg>
                  시나리오 코드 미리보기
                </span>
              </div>

              <pre class="code"><code>{{ detail.code }}</code></pre>
            </div>
          </section>

          <!-- 오른쪽 컬럼 -->
          <aside class="right">
            <!-- 통계 -->
            <div class="side-card">
              <div class="side-title">통계</div>

              <div class="stat-row">
                <div class="stat-left">
                  <div
                    class="flex items-center gap-lg text-[#4a5565] text-[14px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-download"
                      aria-hidden="true"
                    >
                      <path d="M12 15V3" />
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                    <span class="stat-text">다운로드</span>
                  </div>
                </div>
                <div class="stat-value">
                  {{ formatNumber(detail.stats?.downloads ?? 0) }}
                </div>
              </div>

              <div class="stat-row">
                <div class="stat-left">
                  <div
                    class="flex items-center gap-lg text-[#4a5565] text-[14px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-eye"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span class="stat-text">조회수</span>
                  </div>
                </div>
                <div class="stat-value">
                  {{ formatNumber(detail.stats?.views ?? 0) }}
                </div>
              </div>

              <div class="stat-row">
                <div class="stat-left">
                  <div
                    class="flex items-center gap-lg text-[#4a5565] text-[14px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-heart"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
                      />
                    </svg>
                    <span class="stat-text">좋아요</span>
                  </div>
                </div>
                <div class="stat-value">
                  {{ formatNumber(detail.stats?.likes ?? 0) }}
                </div>
              </div>
            </div>

            <!-- 태그 -->
            <div class="side-card">
              <div class="side-title">태그</div>
              <div class="tags">
                <span v-for="t in (detail.tags ?? [])" :key="t" class="tag">{{ t }}</span>
              </div>
            </div>

            <!-- 파일 정보 -->
            <div class="side-card">
              <div class="side-title">파일 정보</div>
              <div class="info-row">
                <span class="info-key">형식</span><span class="info-val">{{ detail.file?.format ?? '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">버전</span><span class="info-val">{{ detail.file?.version ?? '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">파일 크기</span><span class="info-val">{{ detail.file?.size ?? '-' }}</span>
              </div>
            </div>

            <!-- 업로드한 사람 -->
            <div class="side-card">
              <div class="side-title">업로드한 사람</div>
              <div class="uploader">
                <div class="uploader-avatar">{{ detail.uploader?.initials ?? 'U' }}</div>
                <div class="uploader-meta">
                  <div class="uploader-name">{{ detail.uploader?.name ?? '알 수 없음' }}</div>
                  <div class="uploader-sub">
                    총 {{ formatNumber(detail.uploader?.totalScenarios ?? 0) }}개의
                    시나리오
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScenarioDetail } from "~/types/scenario";

definePageMeta({ layout: false }); // 기본 레이아웃(상단 헤더 포함) 비활성화 [web:73]
const { logout } = useAuth();
const { isLoggedIn, userName } = useAuthState();
const { openLogin } = useAuthModal();

const userInitial = computed(() =>
  (userName.value?.trim()?.[0] ?? "U").toUpperCase(),
);

const route = useRoute();
const id = computed(() => String(route.params.id));

// 서버 연동 형태: /nuxt-api/scenarios/:id 로부터 상세 데이터 수신
const {
  data: detail,
  pending,
  error,
  refresh,
} = await useFetch<ScenarioDetail>(() => `/nuxt-api/scenarios/${id.value}/detail`, {
  key: `scenario-${id.value}-detail`,
  watch: [id],
});

async function onLogoutClick() {
  await logout();
}

function goBack() {
  if (!import.meta.client) return;

  // Vue Router가 관리하는 직전 경로 정보 가져오기
  const previousPath = window.history.state?.back;

  // 1. 이전 페이지 정보가 있고 (null이 아님)
  // 2. 그 경로가 문자열이며
  // 3. '/my-scenarios'가 포함되어 있다면 -> 뒤로가기
  if (previousPath && typeof previousPath === "string" && previousPath.includes("/my-scenarios")) {
    history.back();
  } else {
    navigateTo("/explore");
  }
}

watch(isLoggedIn, async () => {
  await refresh();
});

function toggleBookmark() {
  if (!isLoggedIn.value) {
    openLogin();
    return;
  }
  // TODO: 서버 연동으로 좋아요 토글 (현재는 콘솔)
  console.log("like toggle");
}

async function onShare() {
  const url = import.meta.client ? window.location.href : "";
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    alert("링크가 복사되었습니다.");
  }
}

const videoSrc = computed(() => {
  if (!id.value) return "";
  return `/nuxt-api/scenarios/${id.value}/video`;
});

function formatDate(iso: string | undefined) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  } catch {
    return "-";
  }
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

const onDownload = () => {
  if (!id.value) return;
  const downloadUrl = `/nuxt-api/scenarios/${id.value}/download`;
  window.location.href = downloadUrl;
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
}

/* topbar */
.topbar {
  height: 72px;
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 20px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.back-btn:hover {
  border-color: rgba(21, 93, 252, 0.55);
}

.title-wrap {
  min-width: 0;
}
.title {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}
.avatar {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #155dfc;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 11px;
}
.dot {
  opacity: 0.6;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 16px 42px;
}
.state {
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.state.error {
  color: #b91c1c;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  margin-top: 14px;
}

/* left */
.video-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  height: 320px;

  /* 여기부터 수정됨 */
  padding: 0;       /* 내부 여백 제거 */
  display: flex;    /* 비디오 정렬 */
  overflow: hidden; /* 둥근 모서리 밖으로 영상 튀어나감 방지 */
  background: #000; /* 영상 로딩 전 배경 검정색 */
}

/* 새로 추가: 비디오 태그 스타일 */
.simulation-player {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 영상 비율 유지하며 카드 안에 맞춤 */
  outline: none;
}

.panel {
  margin-top: 14px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 16px 16px 14px;
}

.panel-title {
  font-weight: 800;
  color: #0f172a;
  font-size: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-body {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.code-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}
.code {
  margin: 0;
  border-radius: 14px;
  background: #0b1220;
  color: #e2e8f0;
  padding: 14px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
}

/* right */
.side-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 14px;
}
.side-card + .side-card {
  margin-top: 14px;
}
.side-title {
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 10px;
  padding: 8px 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.stat-row + .stat-row {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
.stat-value {
  font-weight: 800;
  color: #0f172a;
  font-size: 14px;
}
.stat-text {
  margin-left: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  background: rgba(21, 93, 252, 0.1);
  color: #155dfc;
  border: 1px solid rgba(21, 93, 252, 0.18);
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #334155;
  font-size: 13px;
}
.info-row + .info-row {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
.info-key {
  color: #64748b;
}

.uploader {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.uploader-avatar {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: #155dfc;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 900;
}
.my-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #eef2ff;
  cursor: pointer;
  display: grid;
  margin: 0 8px;
  place-items: center;
}
.my-avatar-text {
  font-weight: 800;
  color: #334155;
  font-size: 14px;
}

.uploader-name {
  font-weight: 900;
  color: #0f172a;
}
.uploader-email {
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}
.uploader-sub {
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .right {
    order: 2;
  }
}
.btn {
  height: 40px;
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
}
.btn.btn-ghost {
  transition: background-color 0.15s ease, color 0.15s ease, filter 0.15s ease;
  background: #fff;
  border-color: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}
.btn.btn-ghost:hover {
  background-color: rgba(0, 0, 0, 0.08); /* 더 어둡게: 0.12 ~ 0.16 */
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}
</style>
