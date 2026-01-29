<template>
  <div>
    <div class="page">
      <!-- 상단바 -->
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="back-btn"
            type="button"
            aria-label="뒤로가기"
            @click="goBack"
          >
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

          <div class="title-wrap">
            <h1 class="title">{{ detail.title || "..." }}</h1>
            <div class="sub">
              <span class="avatar">{{
                (detail.uploader?.name[0] ?? "U").slice(0, 1)
              }}</span>
              <span class="sub-text">{{ detail.uploader?.name ?? "-" }}</span>
              <span class="dot">•</span>
              <span class="sub-text">{{ formatDate(detail.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 우상단 버튼들 -->
        <div class="topbar-actions">
          <button class="btn btn-share" type="button" @click="onShare">
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
              class="lucide lucide-share2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </svg>
            공유
          </button>

          <button class="btn btn-download" type="button" @click="onDownload">
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
            >
              <path d="M12 15V3" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
            </svg>
            다운로드
          </button>

          <!-- 좋아요 버튼 -->
          <button
            class="btn-like"
            :class="{ 'is-active': detail.isBookmarked }"
            type="button"
            aria-label="좋아요"
            @click="toggleLikeButton"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="heart-icon"
              :class="{ 'heart-filled': detail.isBookmarked }"
              aria-hidden="true"
            >
              <path
                d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
              />
            </svg>
          </button>

          <button
            v-if="!isLoggedIn"
            class="btn btn-ghost"
            type="button"
            @click="openLogin"
          >
            <span class="btn-icon">
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
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.128a4 4 0 0 1 0 7.744" />
              </svg>
            </span>
            로그인
          </button>

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
        <div v-else-if="error" class="state error">
          데이터를 불러오지 못했습니다.
        </div>

        <!-- 메인 그리드 -->
        <div v-else class="grid">
          <!-- 왼쪽 컬럼 -->
          <section class="left">
            <!-- 1. 비디오 카드 -->
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

            <!-- 2. 설명 패널 -->
            <div class="panel">
              <div class="panel-title">설명</div>
              <p class="panel-body">{{ detail.description }}</p>
            </div>

            <!-- 3. 코드 패널 -->
            <div class="panel">
              <div class="panel-title">
                <span class="code-label">
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

          <!-- 오른쪽 컬럼 (사이드바) -->
          <aside class="right">
            <!-- 통계 -->
            <div class="side-card">
              <div class="side-title">통계</div>

              <div class="stat-row">
                <div class="stat-left">
                  <div class="stat-label">
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
                  <div class="stat-label">
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
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
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
                  <div class="stat-label">
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
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
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
                <span class="info-key">버전</span><span class="info-val"> v{{ detail.file?.version ?? '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">파일 크기</span><span class="info-val">{{ detail.file?.size ?? '-' }}</span>
              </div>
            </div>

            <!-- 업로더 -->
            <div class="side-card">
              <div class="side-title">업로드한 사람</div>
              <div class="uploader">
                <div class="uploader-avatar">{{ detail.uploader?.name[0] ?? 'U' }}</div>
                <div class="uploader-meta">
                  <div class="uploader-name">{{ detail.uploader?.name ?? '알 수 없음' }}</div>
                  <div class="uploader-sub">
                    총 {{ formatNumber(detail.uploader?.totalScenarios ?? 0) }}개의 시나리오
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
import type { ApiResponse, Like, ScenarioDetail } from "@/types";

definePageMeta({ layout: false });

const { logout } = useAuth();
const { isLoggedIn, userName, accessToken: token } = useAuthState();
const { openLogin } = useAuthModal();

const route = useRoute();
const id = computed(() => String(route.params.id));

// 1. [초기값]
const DEFAULT_DETAIL: ScenarioDetail = {
  id: 0,
  title: "",
  description: "",
  createdAt: "",
  code: "",
  stats: { downloads: 0, views: 0, likes: 0 },
  tags: [],
  uploader: { name: "", uploader_id: 0, email: "", totalScenarios: 0 },
  file: { format: "", version: "", size: "" },
  isBookmarked: false, // 기본값 false 확인
};

// 2. [로컬 상태]
const detail = ref<ScenarioDetail>({ ...DEFAULT_DETAIL });

// 3. 서버 데이터 가져오기
const { data: serverData, pending, error, refresh } = await useFetch<ScenarioDetail>(
  () => `/nuxt-api/scenarios/${id.value}/detail`, {
    key: `scenario-${id.value}-detail`,
    watch: [id],
  },
);

// 4. [동기화]
watchEffect(() => {
  if (serverData.value) {
    detail.value = JSON.parse(JSON.stringify(serverData.value));
  }
});

watch(isLoggedIn, async () => {
  await refresh();
});

// 5. [액션] 좋아요 토글
function toggleLikeButton() {
  if (!isLoggedIn.value) {
    openLogin();
    return;
  }
  checkMyLikeStatus();
}

// --- 유틸리티 함수 (전체 구현 포함) ---
const checkMyLikeStatus = async () => {
  if (!isLoggedIn.value || !token.value) {
    detail.value.isBookmarked = false;
    return;
  }

  try {
    const res = await $fetch<ApiResponse<Like>>(`/nuxt-api/scenarios/${id.value}/like/`, {
      method: "POST",
    });
    if (res.message) {
      detail.value.isBookmarked = res.message?.liked ? res.message?.liked : false;
      detail.value.stats.likes = res.message?.likes ? res.message?.likes : 0;
    }
  } catch (e) {
    console.error("좋아요 상태 확인 실패", e);
  }
};

const userInitial = computed(() =>
  (userName.value?.trim()?.[0] ?? "U").toUpperCase(),
);

async function onLogoutClick() {
  await logout();
}

function goBack() {
  if (!import.meta.client) return;
  const previousPath = window.history.state?.back;

  if (previousPath && typeof previousPath === "string" && previousPath.includes("/my-scenarios")) {
    history.back();
  } else {
    navigateTo("/explore");
  }
}

async function onShare() {
  // SSR 환경이면 실행 안 함
  if (!import.meta.client) return;

  const url = window.location.href;

  // 1. 최신 방식 (HTTPS 또는 Localhost) 시도
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
      return; // 성공하면 여기서 종료
    } catch (err) {
      console.error("Clipboard API 실패, 폴백 시도:", err);
    }
  }

  // 2. 구형 방식 (HTTP 호환) - 폴백
  try {
    const textArea = document.createElement("textarea");
    textArea.value = url;

    // 화면 밖으로 숨김 (안 보이지만 존재하게)
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      alert("링크가 복사되었습니다.");
    } else {
      throw new Error("execCommand 실패");
    }
  } catch (err) {
    alert("브라우저 보안 설정으로 인해 복사할 수 없습니다.\n수동으로 주소를 복사해주세요.");
    console.error(err);
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
  // 만약 바로 다운로드가 아니라면 window.open(downloadUrl) 등 사용
  window.location.href = downloadUrl;
};
</script>

<style scoped>
/* --- 레이아웃 --- */
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
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
.title-wrap {
  min-width: 0;
}
.title {
  margin: 0;
  font-size: 18px;
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
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* --- 버튼 스타일 --- */
.btn {
  height: 40px;
  border-radius: 8px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  border: 2px solid transparent;
  transition: all 0.15s; /* 부드러운 hover 효과 */
}
.btn.btn-share {
  background: #fff;
  border-color: #e2e8f0;
  color: #0f172a;
}
.btn.btn-share:hover {
  border-color: #155dfc;
  color: #1447e6
}

.btn.btn-download {
  background: #155dfc;
  color: #fff;
}
.btn.btn-download:hover {
  background: #1447e6;
}

.btn-ghost {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

/* --- 좋아요 버튼 스타일 (수정됨) --- */
.btn-like {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fff;
  border: 2px solid #e5e7eb;
  color: #64748b;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s;
}

.btn-like:hover {
  border-color: #ef4444;
  color: #dc2626;
}

/* 활성화 상태 (isBookmarked = true) */
.btn-like.is-active {
  border-color: #ef4444;
  color: #dc2626;
}
.is-active:hover {
  background: #fee2e2;
}

/* 하트 아이콘 기본 */
.heart-icon {
  width: 23px;
  height: 23px;
  min-width: 23px;
  fill: none;
  transition: fill 0.15s;
}

/* 하트 아이콘 채움 상태 */
.heart-filled {
  fill: #ef4444;
}

/* --- 사용자 아바타 --- */
.my-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #eef2ff;
  cursor: pointer;
  display: grid;
  place-items: center;
  margin-left: 8px;
}
.my-avatar-text {
  font-weight: 800;
  color: #334155;
  font-size: 14px;
}

/* --- 레이아웃 & 패널 --- */
.main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 16px 42px;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  margin-top: 14px;
}

/* 왼쪽 컬럼 */
.left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 비디오 카드 */
.video-card {
  background: #000;
  border-radius: 16px;
  border: 4px #000 solid;
  overflow: hidden;
  display: flex;
}
.simulation-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 일반 패널 */
.panel {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 16px;
}
.panel-title {
  font-weight: 800;
  color: #0f172a;
  font-size: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.panel-body {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}
.code {
  background: #0b1220;
  color: #e2e8f0;
  padding: 14px;
  border-radius: 14px;
  font-size: 12px;
  overflow: auto;
  margin: 0;
}
.code-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* --- 오른쪽 사이드 --- */
.side-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 14px;
}
.side-title {
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 10px;
  padding: 0 4px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 4px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
.stat-row:first-of-type { border-top: none; }
.stat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}
.stat-value {
  font-weight: 800;
  color: #0f172a;
  font-size: 14px;
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
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 13px;
}
.info-row:first-of-type { border-top: none; }
.info-key { color: #64748b; }
.uploader {
  display: flex;
  gap: 12px;
  align-items: center;
}
.uploader-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #155dfc;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
}
.uploader-name {
  font-weight: 800;
  color: #0f172a;
  font-size: 14px;
}
.uploader-sub {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
