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
            :class="{ 'toolbar-chip--active': onlyBookmarked }"
            @click="onlyBookmarked = !onlyBookmarked"
          >
            즐겨찾기
          </button>
        </div>

        <div class="toolbar-right">
          <button type="button" class="toolbar-filter">
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
              aria-hidden="true"
            >
              <path d="M4 4h16" />
              <path d="M6 8h12" />
              <path d="M8 12h8" />
              <path d="M10 16h4" />
            </svg>
            필터
          </button>
        </div>
      </section>

      <!-- 카드 그리드 -->
      <section class="grid">
        <article
          v-for="item in pagedItems"
          :key="item.id"
          class="card bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <!-- 상단 정보 -->
          <header class="card-header">
            <div class="card-avatar">
              {{ item.uploader.initials }}
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
          <div class="card-tags">
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="tag-badge"
            >
              {{ tag }}
            </span>
          </div>

          <!-- 하단 통계 + 액션 -->
          <footer class="card-footer">
            <div class="card-stats">
              <span class="card-stat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 15V3" />
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                  />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                {{ formatNumber(item.stats.downloads) }}
              </span>

              <span class="card-stat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {{ formatNumber(item.stats.views) }}
              </span>

              <span class="card-stat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
                  />
                </svg>
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
                  class="lucide lucide-eye mr-1"
                  aria-hidden="true"
                >
                  <path
                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                보기
              </button>

              <!-- 하트 버튼 -->
              <button
                type="button"
                :class="[item.bookmarked ? 'btn-like--active' : 'btn-like']"
                :aria-pressed="item.bookmarked ? 'true' : 'false'"
                @click="toggleBookmark(item)"
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
                  :class="[
                    'lucide lucide-heart',
                    item.bookmarked ? 'fill-red-500' : '',
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
                  class="lucide lucide-download mr-1"
                  aria-hidden="true"
                >
                  <path d="M12 15V3" />
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                  />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                다운로드
              </button>
            </div>
          </footer>
        </article>
      </section>

      <!-- 페이지네이션 -->
      <nav v-if="totalPages > 1" class="pagination" aria-label="페이지 네비게이션">
        <button
          type="button"
          class="pagination-btn"
          :disabled="page === 1"
          @click="goPrev"
        >
          이전
        </button>

        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="pagination-page"
          :class="{ 'pagination-page--active': p === page }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>

        <button
          type="button"
          class="pagination-btn"
          :disabled="page === totalPages"
          @click="goNext"
        >
          다음
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
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

// 서버에서 더미 데이터(추후 실제 데이터) 가져오기
const { data } = await useFetch<{ items: ScenarioItem[] }>("/api/explore");

// null 방어
const allItems = computed(() => data.value?.items ?? []);

// 정렬/필터/페이지네이션 로직은 그대로 사용
const sort = ref<"popular" | "latest">("popular");
const onlyBookmarked = ref(false);
const pageSize = 12;
const page = ref(1);

const filteredAndSorted = computed(() => {
  let list = [...allItems.value];

  if (onlyBookmarked.value) {
    list = list.filter((item) => item.bookmarked);
  }

  if (sort.value === "latest") {
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else {
    const score = (x: ScenarioItem) =>
      x.stats.downloads * 3 + x.stats.likes;
    list.sort((a, b) => score(b) - score(a));
  }

  return list;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAndSorted.value.length / pageSize)),
);

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredAndSorted.value.slice(start, start + pageSize);
});

// 페이지 이동
function goPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function goPrev() {
  goPage(page.value - 1);
}
function goNext() {
  goPage(page.value + 1);
}

// 액션들
function onView(item: ScenarioItem) {
  navigateTo(`/scenarios/${item.id}`);
}

function toggleBookmark(item: ScenarioItem) {
  item.bookmarked = !item.bookmarked;
}

function onDownload(item: ScenarioItem) {
  console.log("download scenario", item.id);
  // 실제 서버 연동 시:
  // await $fetch(`/api/scenarios/${item.id}/download`, { method: "POST" })
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
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}
.hero-title {
  margin: 0 0 8px;
  font-size: 24px;
  letter-spacing: -0.4px;
}
.hero-sub {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
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

/* Tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  background: #dbeafe;
  color: #1d4ed8;
  transition: background-color 0.12s ease;
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
  background: #fee2e2;
  color: #dc2626;
}
.btn-like--active:hover {
  background: #fecaca;
}

/* Download button */
.btn-download {
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
