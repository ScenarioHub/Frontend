<template>
  <div class="page">
    <main class="main">
      <!-- 로딩/에러 -->
      <div v-if="pending" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state error">
        목록을 불러오지 못했습니다.
      </div>

      <!-- 데이터 없음 (Empty State) -->
      <div v-else-if="scenarios.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p class="empty-text">아직 작성하신 시나리오가 없습니다.</p>
        <button class="empty-btn" @click="navigateTo('/generator')">
          새 시나리오 만들기
        </button>
      </div>

      <!-- 리스트 & 페이지네이션 -->
      <div v-else>
        <section class="list">
          <!-- scenarios 대신 pagedScenarios 사용 -->
          <article v-for="item in pagedScenarios" :key="item.id" class="card">
            <div class="card-left">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-desc">{{ item.summary }}</p>

              <div class="meta">
                <span class="meta-item">
                  생성일: {{ formatDate(item.createdAt) }}
                </span>
                <span class="meta-item meta-downloads">
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
                    <path d="M12 15V3" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                  {{ item.downloadCount }}
                </span>
              </div>
            </div>

            <div class="card-actions">
              <button
                class="bg-[#155dfc] hover:bg-[#1447e6] text-white px-4 py-2 rounded-lg text-[14px] flex items-center gap-2"
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
                  aria-hidden="true"
                >
                  <path
                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                보기
              </button>

              <button
                class="bg-white border-2 border-gray-200 hover:border-red-500 text-red-500 px-4 py-2 rounded-lg text-[14px] flex items-center gap-2"
                @click="openDeleteModal(item)"
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
                  aria-hidden="true"
                >
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                삭제
              </button>
            </div>
          </article>
        </section>

        <!-- ✅ 페이지네이션 UI -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            이전
          </button>

          <span class="page-info">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            다음
          </button>
        </div>
      </div>
    </main>

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
            <strong>{{ deletingItem?.title }}</strong> 시나리오를 삭제하면
            복구할 수 없습니다.
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
import type { ApiError, ApiResponse, MyScenarioItem } from "@/types";

definePageMeta({
  middleware: ["auth"],
});

const { isLoggedIn } = useAuthState();

const { data, pending, error, refresh } = await useFetch<MyScenarioItem[]>("/nuxt-api/scenarios/my-scenarios", {
  server: false,
  immediate: isLoggedIn.value === true,
});
const scenarios = computed(() => data.value ?? []);

const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => {
  return Math.ceil(scenarios.value.length / itemsPerPage) || 1;
});

const pagedScenarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return scenarios.value.slice(start, end);
});

watch(scenarios, () => {
  currentPage.value = 1;
});

const isDeleteOpen = ref(false);
const deletingItem = ref<MyScenarioItem | null>(null);
const deleting = ref(false);

watch(
  () => isLoggedIn.value,
  (v) => {
    if (import.meta.client && v !== true) {
      alert("로그아웃하여 홈으로 이동합니다.");
      navigateTo("/");
    }
  },
  { immediate: true },
);

function onView(item: MyScenarioItem) {
  return navigateTo(`/scenarios/${item.id}`);
}

function openDeleteModal(item: MyScenarioItem) {
  deletingItem.value = item;
  isDeleteOpen.value = true;
}

function closeDeleteModal() {
  isDeleteOpen.value = false;
  deletingItem.value = null;
}

async function confirmDelete() {
  if (!deletingItem.value) return;
  deleting.value = true;

  try {
    const deleteResponseData = await $fetch<ApiResponse<string>>(`/nuxt-api/scenarios/${deletingItem.value.id}/delete`, { method: "DELETE" });
    if (deleteResponseData.status == 200) {
      alert("삭제되었습니다.");
      await refresh();
    }
  } catch (error) {
    console.error("삭제 실패:", error);
    const err = error as ApiError;
    alert(err.statusMessage || "삭제 중 오류가 발생했습니다.");
  }

  deleting.value = false;
  closeDeleteModal();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
</script>

<style scoped>
/* 기존 스타일 그대로 유지 */
.page {
  min-height: 90vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
}

.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 16px 40px;
}

.state {
  max-width: 1080px;
  margin: 24px auto 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.state.error {
  color: #b91c1c;
}

.list {
  display: grid;
  gap: 18px;
  margin-top: 16px;
}

.card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 18px 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.card-title {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.3px;
}

.card-desc {
  margin: 8px 0 12px;
  color: #64748b;
  font-size: 13px;
}

.meta {
  display: flex;
  gap: 14px;
  align-items: center;
  color: #475569;
  font-size: 12px;
}

.meta-downloads {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #334155;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Modal Styles */
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px dashed rgba(15, 23, 42, 0.2);
  margin-top: 16px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-text {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 24px;
}

.empty-btn {
  background: #155dfc;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.empty-btn:hover {
  background: #1447e6;
}

/* ✅ Pagination Styles (추가됨) */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.page-info {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}
</style>
