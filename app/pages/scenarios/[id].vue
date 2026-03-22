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
            <Icon
              name="lucide:chevron-left"
              :size="22"
            />
          </button>

          <div class="title-wrap">
            <h1 class="title">{{ detail.title || "..." }}</h1>
            <div class="sub">
              <span class="avatar">{{
                (detail.uploader?.name[0] ?? "U").slice(0, 1)
              }}</span>
              <span class="sub-text">{{ detail.uploader?.name ?? "-" }}</span>
              <span class="dot">•</span>
              <span class="sub-text">{{ formatDate(detail.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 우상단 버튼들 -->
        <div class="topbar-actions">
          <!-- 1. 삭제 버튼 (소유자만) -->
          <button
            v-if="detail.isOwner"
            class="bg-white border-2 border-gray-200 hover:border-red-500 text-red-500 px-4 py-2 rounded-lg text-[14px] flex items-center gap-2"
            @click="openDeleteModal()"
          >
            <Icon
              name="lucide:trash-2"
              :size="16"
            />
            삭제
          </button>

          <!-- 2. 공유 버튼 -->
          <button class="btn btn-share" type="button" @click="onShare">
            <Icon
              name="lucide:share-2"
              :size="16"
            />
            공유
          </button>

          <!-- 3. 다운로드 버튼 -->
          <button class="btn btn-download" type="button" @click="onDownload">
            <Icon
              name="lucide:download"
              :size="16"
            />
            다운로드
          </button>

          <!-- 4. 좋아요 버튼 -->
          <button
            class="btn-like"
            :class="{ 'is-active': detail.isLiked }"
            type="button"
            aria-label="좋아요"
            @click="toggleLikeButton"
          >
            <!-- 이것도 Icon화 하려했는데 많이 귀찮아져서 포기 -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="heart-icon"
              :class="{ 'heart-filled': detail.isLiked }"
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
              <Icon
                name="lucide:user"
                :size="20"
                class="align-middle"
              />
            </span>
            로그인
          </button>

          <!-- 로그인 상태일 때: 드롭다운 메뉴 -->
          <Menu v-else as="div" class="relative inline-block text-left">
            <!-- 메뉴 버튼 (아바타) -->
            <MenuButton class="my-avatar" aria-label="사용자 메뉴">
              <span class="my-avatar-text">{{ userInitial }}</span>
            </MenuButton>

            <!-- 드롭다운 패널 -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              >
                <!-- 사용자 정보 (헤더) -->
                <div class="px-4 py-3 border-b border-gray-100">
                  <p class="text-sm font-bold text-gray-900">
                    {{ userName || "사용자" }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">로그인된 계정</p>
                </div>

                <div class="py-1">
                  <MenuItem v-slot="{ active, close }">
                    <button
                      type="button"
                      :class="[
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full text-left px-4 py-2 text-sm',
                      ]"
                      @click="() => {
                        navigateTo('/my-scenarios');
                        close();
                      }"
                    >
                      내 시나리오
                    </button>
                  </MenuItem>

                  <MenuItem v-slot="{ active, close }">
                    <button
                      type="button"
                      :class="[
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full text-left px-4 py-2 text-sm',
                      ]"
                      @click="() => {
                        // navigateTo('/settings'); // 나중에 경로 생기면 추가
                        close();
                      }"
                    >
                      설정
                    </button>
                  </MenuItem>
                </div>

                <!-- 로그아웃 버튼 -->
                <div class="py-1 border-t border-gray-100">
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      :class="[
                        active ? 'bg-gray-100 text-red-600' : 'text-red-600',
                        'block w-full text-left px-4 py-2 text-sm',
                      ]"
                      @click="onLogoutClick"
                    >
                      로그아웃
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
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
                v-if="false"
                controls
                preload="metadata"
                class="simulation-player"
                :src="videoSrc"
              >
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
              <ScenarioViewer v-model:scenario-id="detail.data_id" />
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
                  <Icon
                    name="lucide:code"
                    :size="16"
                  />
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
                    <Icon
                      name="lucide:download"
                      :size="16"
                    />
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
                    <Icon
                      name="lucide:eye"
                      :size="16"
                    />
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
                    <Icon
                      name="lucide:heart"
                      :size="16"
                    />
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
                <span v-for="t in detail.tags ?? []" :key="t" class="tag">{{
                  t
                }}</span>
              </div>
            </div>

            <!-- 파일 정보 -->
            <div class="side-card">
              <div class="side-title">파일 정보</div>
              <div class="info-row">
                <span class="info-key">형식</span><span class="info-val">{{
                  detail.file?.format ?? "-"
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">버전</span><span class="info-val">
                  v{{ detail.file?.version ?? "" }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">파일 크기</span><span class="info-val">{{ formattedSize ?? "-" }} KB</span>
              </div>
            </div>

            <!-- 업로더 -->
            <div class="side-card">
              <div class="side-title">업로드한 사람</div>
              <div class="uploader">
                <div class="uploader-avatar">
                  {{ detail.uploader?.name[0] ?? "U" }}
                </div>
                <div class="uploader-meta">
                  <div class="uploader-name">
                    {{ detail.uploader?.name ?? "알 수 없음" }}
                  </div>
                  <div class="uploader-sub">
                    총
                    {{ formatNumber(detail.uploader?.totalScenarios ?? 0) }}개의
                    시나리오
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
    <!-- 삭제 확인 모달 -->
    <teleport to="body">
      <div
        v-if="isDeleteOpen"
        class="modal-backdrop"
        @click.self="closeDeleteModal"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteTitle"
        >
          <h3 id="deleteTitle" class="modal-title">정말 삭제할까요?</h3>
          <p class="modal-desc">
            <strong>{{ detail.title }}</strong> 시나리오를 삭제하면 복구할 수
            없습니다.
          </p>

          <div class="modal-actions">
            <button class="modal-btn ghost" @click="closeDeleteModal">
              취소
            </button>
            <button
              class="modal-btn danger"
              :disabled="deleting"
              @click="confirmDelete"
            >
              {{ deleting ? "삭제 중..." : "삭제" }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import type { ApiError, ApiResponse, Like, ScenarioDetail } from "@/types";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
// ✅ 추가
definePageMeta({ layout: false });

const { logout } = useAuth();
const { isLoggedIn, userName, accessToken } = useAuthState();
const { openLogin } = useAuthModal();

const route = useRoute();
const id = computed(() => String(route.params.id));

const isDeleteOpen = ref(false);
const deleting = ref(false);

// 1. [초기값]
const DEFAULT_DETAIL: ScenarioDetail = {
  id: 0,
  title: "",
  description: "",
  created_at: "",
  code: "",
  stats: { downloads: 0, views: 0, likes: 0 },
  tags: [],
  uploader: { name: "", uploaderid: 0, email: "", totalScenarios: 0 },
  file: { format: "", version: "", size: 0 },
  isLiked: false,
  isOwner: false,
  data_id: 0,
};

// 2. [로컬 상태]
const detail = ref<ScenarioDetail>({ ...DEFAULT_DETAIL });

// 3. 서버 데이터 가져오기
const {
  data: serverData,
  pending,
  error,
  refresh,
} = await useFetch<ScenarioDetail>(
  () => `/nuxt-api/board/${id.value}/details/`,
  {
    key: `scenario-${id.value}-detail`,
    watch: [id],
    server: false,
  },
);

// 4. [동기화]
watchEffect(() => {
  if (serverData.value) {
    detail.value = JSON.parse(JSON.stringify(serverData.value));
  }
});

watch([isLoggedIn, accessToken], async () => {
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
  if (!isLoggedIn.value || !accessToken.value) {
    detail.value.isLiked = false;
    return;
  }

  try {
    const res = await $fetch<ApiResponse<Like>>(
      `/nuxt-api/board/${id.value}/like/`,
      {
        method: "POST",
      },
    );
    if (res.message) {
      detail.value.isLiked = res.message?.liked
        ? res.message?.liked
        : false;
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

  if (
    previousPath
    && typeof previousPath === "string"
    && (previousPath.includes("/my-scenarios") || previousPath.includes("/explore"))
  ) {
    history.back();
  } else {
    navigateTo("/explore");
  }
}

function openDeleteModal() {
  isDeleteOpen.value = true;
}

function closeDeleteModal() {
  isDeleteOpen.value = false;
}

async function confirmDelete() {
  deleting.value = true;

  try {
    const deleteResponseData = await $fetch<ApiResponse<string>>(
      `/nuxt-api/board/${detail.value.id}/delete`,
      { method: "DELETE" },
    );
    if (deleteResponseData.status == 200) {
      alert("삭제되었습니다.");
      navigateTo("/explore");
    }
  } catch (error) {
    console.error("삭제 실패:", error);
    const err = error as ApiError;
    alert(err.statusMessage || "삭제 중 오류가 발생했습니다.");
  }

  deleting.value = false;
  closeDeleteModal();
}

async function onShare() {
  if (!import.meta.client) return;

  const url = window.location.href;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
      return;
    } catch (err) {
      console.error("Clipboard API 실패, 폴백 시도:", err);
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = url;
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
    alert(
      "브라우저 보안 설정으로 인해 복사할 수 없습니다.\n수동으로 주소를 복사해주세요.",
    );
    console.error(err);
  }
}

const videoSrc = computed(() => {
  if (!id.value) return "";
  return `/nuxt-api/board/${id.value}/video`;
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
const formattedSize = computed(() => {
  return formatBytesToKB(detail.value.file.size);
});
const onDownload = () => {
  if (!id.value) return;
  const downloadUrl = `/nuxt-api/board/${id.value}/download`;
  window.location.href = downloadUrl;
  detail.value.stats.downloads += 1;
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
  transition: all 0.15s;
}
.btn.btn-share {
  background: #fff;
  border-color: #e2e8f0;
  color: #0f172a;
}
.btn.btn-share:hover {
  border-color: #155dfc;
  color: #1447e6;
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

/* --- 좋아요 버튼 스타일 --- */
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

.btn-like.is-active {
  border-color: #ef4444;
  color: #dc2626;
}
.is-active:hover {
  background: #fee2e2;
}

.heart-icon {
  width: 22px;
  height: 22px;
  min-width: 22px;
  fill: none;
  transition: fill 0.15s;
}

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
.stat-row:first-of-type {
  border-top: none;
}
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
.info-row:first-of-type {
  border-top: none;
}
.info-key {
  color: #64748b;
}
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
  .grid {
    grid-template-columns: 1fr;
  }
}

/* modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
}

.modal {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
  padding: 18px 18px 16px;
}

.modal-title {
  margin: 0 0 10px;
  font-size: 18px;
  letter-spacing: -0.3px;
}
.modal-desc {
  margin: 0 0 16px;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.modal-btn.ghost {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.14);
  color: #0f172a;
}

.modal-btn.danger {
  background: #ef4444;
  color: #fff;
  transition: background-color 0.15s ease;
}
.modal-btn.danger:hover {
  background: #dc2626;
}
.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
