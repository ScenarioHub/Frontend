<template>
  <div class="page">
    <main class="main">
      <!-- 상단 타이틀/설명 영역 -->
      <section class="hero">
        <p class="hero-eyebrow">시나리오 탐색</p>
        <h1 class="hero-title">커뮤니티에서 공유된 자율주행 시나리오를 찾아보세요</h1>
        <p class="hero-sub">
          다양한 도로/교통 상황을 담은 시나리오를 검색하고, 테스트에 활용해 보세요.
        </p>
      </section>

      <!-- 간단한 정렬/필터 영역(지금은 더미, 동작은 안 함) -->
      <section class="toolbar">
        <div class="toolbar-left">
          <button
            type="button"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': sort === 'popular' }"
            @click="sort = 'popular'"
          >
            인기
          </button>
          <button
            type="button"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': sort === 'latest' }"
            @click="sort = 'latest'"
          >
            최신
          </button>
          <button
            type="button"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': sort === 'oldest' }"
            @click="sort = 'oldest'"
          >
            과거
          </button>
          <button
            v-if="isLoggedIn===true"
            type="button"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': onlyLiked }"
            @click="onlyLiked = !onlyLiked"
          >
            즐겨찾기
          </button>
        </div>
      </section>

      <!-- 카드 그리드 -->
      <section class="grid">
        <article
          v-for="item in uiItems"
          :key="item.postId"
          class="card bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <!-- 상단 정보 -->
          <header class="card-header">
            <div class="card-avatar">
              {{ item.uploader.name[0] }}
            </div>

            <div class="card-header-text">
              <h2 class="card-title">{{ item.title }}</h2>
              <p class="card-meta">
                {{ item.uploader.name }}
                <span class="card-dot">•</span>
                {{ formatDate(item.createdAt) }}
              </p>
            </div>
          </header>

          <!-- 설명 -->
          <p class="card-desc">
            {{ item.description }}
          </p>

          <!-- 태그 -->
          <div class="card-tags-wrapper">
            <div class="card-tags-wrapper-wrapper">
              <button
                v-if="tagOverflowMap[item.postId]"
                type="button"
                class="tags-arrow tags-arrow-left"
                aria-label="이전 태그 보기"
                @click="scrollTagsLeft($event)"
              >
                ‹
              </button>

              <div
                ref="tagContainers"
                class="card-tags"
              >
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="tag-badge"
                >
                  {{ tag }}
                </span>
              </div>

              <button
                v-if="tagOverflowMap[item.postId]"
                type="button"
                class="tags-arrow tags-arrow-right"
                aria-label="다음 태그 보기"
                @click="scrollTagsRight($event)"
              >
                ›
              </button>
            </div>
          </div>

          <!-- 하단 통계 + 액션 -->
          <footer class="card-footer">
            <div class="card-stats">
              <span class="card-stat">
                <Icon
                  name="lucide:download"
                  :size="14"
                />
                {{ formatNumber(item.stats.downloads) }}
              </span>

              <span class="card-stat">
                <Icon
                  name="lucide:eye"
                  :size="14"
                />
                {{ formatNumber(item.stats.views) }}
              </span>

              <span class="card-stat">
                <Icon
                  name="lucide:heart"
                  :size="14"
                />
                {{ formatNumber(item.stats.likes) }}
              </span>
            </div>

            <div class="card-actions">
              <!-- 보기 버튼 -->
              <button
                type="button"
                class="btn-view"
                @click="onView(item)"
              >
                <Icon
                  name="lucide:eye"
                  :size="16"
                  class="mr-1"
                />
                보기
              </button>

              <!-- 하트 버튼 -->
              <button
                type="button"
                :class="[item.isLiked ? 'btn-like--active' : 'btn-like']"
                :aria-pressed="item.isLiked ? 'true' : 'false'"
                @click="toggleLike(item)"
              >
                <!-- 이것도 Icon화 하려했는데 많이 귀찮아져서 포기 -->
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
                  :class="[
                    'lucide lucide-heart',
                    item.isLiked ? 'fill-red-500' : '',
                  ]"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
                  />
                </svg>
              </button>

              <!-- 다운로드 버튼 -->
              <button
                type="button"
                class="btn-download"
                @click="onDownload(item)"
              >
                <Icon
                  name="lucide:download"
                  :size="16"
                  class="mr-1"
                />
                다운로드
              </button>
            </div>
          </footer>
        </article>
      </section>

      <!-- 페이지네이션 -->
      <nav class="pagination" aria-label="페이지 네비게이션">
        <button
          type="button"
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goPrev"
        >
          이전
        </button>

        <!-- 여기부터 수정 -->
        <template v-for="p in visiblePages" :key="p + ''">
          <!-- 숫자 버튼 -->
          <button
            v-if="p !== '...'"
            type="button"
            class="pagination-page"
            :class="{ 'pagination-page--active': p === currentPage }"
            @click="goPage(p as number)"
          >
            {{ p }}
          </button>

          <!-- ... 표시 -->
          <span
            v-else
            class="pagination-ellipsis"
          >
            ...
          </span>
        </template>
        <!-- 여기까지 -->

        <button
          type="button"
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goNext"
        >
          다음
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, Like, Post, ScenarioItem, Sort } from "~/types";

const route = useRoute();
const router = useRouter();

const sort = ref<Sort>(
  (route.query.sort?.toString() as Sort) || "popular",
);

const onlyLiked = ref(Boolean(route.query.liked) || false);
// const pageSize = 12;
const currentPage = ref(Number(route.query.page) || 1);
const totalPages = ref(1);

const { isLoggedIn, accessToken } = useAuthState();
const { openLogin } = useAuthModal();

const tagOverflowMap = ref<Record<string, boolean>>({});
const tagContainers = ref<HTMLElement[]>([]);

const { data: serverData, refresh } = await useFetch<Post>("/nuxt-api/board/explore", {
  query: {
    page: currentPage,
    sort: sort,
    onlyLiked: onlyLiked,
  },
  server: false,
});

const uiItems = ref<ScenarioItem[]>([]);

onMounted(() => {
  nextTick(() => {
    recomputeTagOverflow();
  });
});

watch(
  serverData,
  (newData) => {
    if (newData?.posts) {
      uiItems.value = newData?.posts || [];
    }
    if (newData?.currentPage) {
      currentPage.value = newData?.currentPage;
    }
    if (newData?.totalPages) {
      totalPages.value = newData?.totalPages;
    }
  },
  { immediate: true, deep: true },
);

watch([isLoggedIn, accessToken], async () => {
  await refresh();
});

watch(
  () => [uiItems.value], // 감지 대상도 uiItems로 변경
  () => nextTick(recomputeTagOverflow),
  { deep: true },
);

watch([currentPage, sort, onlyLiked], () => {
  const nextQuery = {
    ...route.query,
    page: currentPage.value.toString(),
    sort: sort.value,
    liked: onlyLiked.value ? "true" : undefined,
  };
  watch(() => route.query, (newQuery) => {
    currentPage.value = Number(newQuery.page) || 1;
    sort.value = (newQuery.sort as Sort) || "popular";
    onlyLiked.value = newQuery.liked === "true";
  });
  // 동일하면 push 안 함 (watch 3번 트리거 차단)
  if (
    route.query.page === nextQuery.page
    && route.query.sort === nextQuery.sort
    && String(route.query.liked ?? "") === String(nextQuery.liked ?? "")
  ) {
    return;
  }
  router.replace({ path: "/explore", query: nextQuery }); // replace로 히스토리 중복 방지
});

watch(() => route.query, (newQuery) => {
  currentPage.value = Number(newQuery.page) || 1;
  sort.value = (newQuery.sort as Sort) || "popular"; // validSorts 검증 추가 추천
  onlyLiked.value = newQuery.liked === "true";
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;

  const pages: (number | string)[] = [];
  pages.push(1);

  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  if (start > 2) pages.push("...");

  for (let p = start; p <= end; p++) {
    pages.push(p);
  }

  if (end < total - 1) pages.push("...");
  if (total > 1) pages.push(total);

  return pages;
});

// --- 액션 함수들 ---

function goPage(p: number) {
  if (1 <= p && p <= totalPages.value) {
    currentPage.value = p;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function goPrev() {
  goPage(currentPage.value - 1);
}

function goNext() {
  goPage(currentPage.value + 1);
}

function onView(item: ScenarioItem) {
  navigateTo(`/scenarios/${item.postId}`);
}

// [핵심 수정] 북마크 토글 함수
function toggleLike(item: ScenarioItem) {
  if (!isLoggedIn.value) {
    openLogin();
    return;
  }
  checkMyLikeStatus(item);
}

const checkMyLikeStatus = async (item: ScenarioItem) => {
  if (!isLoggedIn.value || !accessToken.value) {
    item.isLiked = false;
    return;
  }

  try {
    const res = await $fetch<ApiResponse<Like>>(`/nuxt-api/board/${item.postId}/like/`, {
      method: "POST",
    });
    if (res.message) {
      item.isLiked = res.message?.liked ? res.message?.liked : false;
      item.stats.likes = res.message?.likes ? res.message?.likes : 0;
      refresh();
    }
  } catch (e) {
    console.error("좋아요 상태 확인 실패", e);
  }
};

function onDownload(item: ScenarioItem) {
  if (!item.postId) return;

  console.log("download scenario", item.postId);
  const downloadUrl = `/nuxt-api/board/${item.postId}/download/`;

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 30000);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

function recomputeTagOverflow() {
  const map: Record<string, boolean> = {};
  uiItems.value.forEach((item, index) => {
    const el = tagContainers.value[index];
    if (!el) return;
    const isOverflow = el.scrollWidth > el.clientWidth;
    map[item.postId] = isOverflow;
  });
  tagOverflowMap.value = map;
}

const TAG_SCROLL_AMOUNT = 240;

function scrollTagsFromEvent(e: MouseEvent, direction: "left" | "right") {
  const button = e.currentTarget as HTMLElement | null;
  if (!button) return;
  const parent = button.parentElement;
  if (!parent) return;
  const tags = (parent.querySelector(".card-tags") as HTMLElement | null) ?? null;
  if (!tags) return;
  const delta = direction === "left" ? -TAG_SCROLL_AMOUNT : TAG_SCROLL_AMOUNT;
  tags.scrollBy({ left: delta, behavior: "smooth" });
}

function scrollTagsLeft(e: MouseEvent) {
  scrollTagsFromEvent(e, "left");
}
function scrollTagsRight(e: MouseEvent) {
  scrollTagsFromEvent(e, "right");
}
</script>

<style scoped>
.page {
  min-height: 90vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
}

.main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 16px 48px;
}

/* Hero (상단 타이틀) */
.hero {
  margin: 20px 0 24px;
}
.hero-eyebrow {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}
.hero-title {
  margin: 0 0 8px;
  font-size: 32px;
  letter-spacing: -0.4px;
}
.hero-sub {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

/* Toolbar */
.toolbar {
  margin: 20px 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-right {
  flex-shrink: 0;
}
.toolbar-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease,
    border-color 0.15s ease;
}
.toolbar-chip--active {
  background: #155dfc;
  border-color: #155dfc;
  color: #fff;
}
.toolbar-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 6px 12px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

/* Card layout (Tailwind 유틸과 같이 사용) */
.card-header {
  display: flex;
  gap: 10px;
  align-items: center;
}
.card-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #155dfc;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 14px;
}
.card-header-text {
  min-width: 0;
}
.card-title {
  margin: 0;
  font-size: 15px;
  letter-spacing: -0.2px;
}
.card-meta {
  margin: 3px 0 0;
  font-size: 12px;
  color: #6b7280;
}
.card-dot {
  margin: 0 4px;
  opacity: 0.6;
}

.card-desc {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;

  /* 3줄 고정 + ... */
  display: -webkit-box;
  -webkit-line-clamp: 3;         /* 최대 3줄 */
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  /* 높이 3줄로 고정 (min/max 둘 다) */
  min-height: calc(1.5em * 3);
  max-height: calc(1.5em * 3);
}

.card-tags-wrapper-wrapper{
  position: relative;
  width: 100%;
}

.card-tags-wrapper {
  position: relative;
  width: 100%;
  /* 태그 높이만큼만 차지하도록 필요시 높이 조정 가능 */
  min-height: 27px;
}
/* Tags */
.card-tags {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start; /* 왼쪽 정렬 */
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  scroll-behavior: smooth;
}
.card-tags::-webkit-scrollbar {
  display: none;
}
.card-tags::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7);
  border-radius: 999px;
}
.card-tags::-webkit-scrollbar-track {
  background: transparent;
}
.card-tags.is-dragging {
  cursor: grabbing;
}
.card-tags {
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;     /* Firefox */
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  background: #dbeafe;
  color: #1d4ed8;
  white-space: nowrap;
  flex: 0 0 auto;
}
.tags-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 24px;
  border-radius: 999px;
  border: none;
  background: rgba(148, 163, 184, 0.85);
  color: #ffffff;
  font-size: 14px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}

.tags-arrow-left { left: 0; }
.tags-arrow-right { right: 0; }

/* 카드 호버 시에만 보이게 */
.card:hover .tags-arrow {
  display: flex;
}

.tag-badge:hover {
  background: #bfdbfe;
}

/* Footer */
.card-footer {
  display: flex;              /* 기존 block 제거 */
  flex-direction: column;     /* 위에 stats, 아래에 actions */
  gap: 20px;                  /* stats와 actions 사이 간격 */
}
.card-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #64748b;
}
.card-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Buttons */
.btn-view {
  cursor: pointer;
  inline-size: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
  border-radius: 0.375rem;
  border-width: 2px;
  border-color: #e5e7eb;
  background: #fff;
  color: #111827;
  height: 32px;
  padding: 0 12px;
}
.btn-view:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

/* Heart button (기본 / active) */
.btn-like,
.btn-like--active {
  cursor: pointer;
  inline-size: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
  border-radius: 0.375rem;
  border-width: 2px;
  height: 32px;
  padding: 0 10px;
}
.btn-like {
  border-color: #e5e7eb;
  background: #fff;
  color: #111827;
}
.btn-like:hover {
  border-color: #ef4444;
  color: #dc2626;
}
.btn-like--active {
  border-color: #ef4444;
  color: #dc2626;
}
.btn-like--active:hover {
  background: #fee2e2;
}

/* Download button */
.btn-download {
  cursor: pointer;
  inline-size: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
  border-radius: 0.375rem;
  border-width: 0;
  height: 32px;
  padding: 0 12px;
  background: #2563eb;
  color: #f9fafb;
}
.btn-download:hover {
  background: #1d4ed8;
}

.btn-view,
.btn-download {
  flex: 1;            /* 남는 공간을 양쪽 버튼이 나눠 가짐 */
  justify-content: center;
}

.btn-like,
.btn-like--active {
  flex: 0 0 auto;
}

/* Pagination */
.pagination {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.pagination-btn {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-page {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: #e5e7eb;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
}
.pagination-page--active {
  background: #155dfc;
  color: #fff;
}
.pagination-ellipsis {
  padding: 0 4px;
  font-size: 12px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  .card-actions {
    width: 100%;
  }
}
.card-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between; /* 좌우로 펼치기 */
  align-items: center;
  width: 100%;                    /* 카드 가로 전체 사용 */
  flex-wrap: nowrap;
}
</style>
