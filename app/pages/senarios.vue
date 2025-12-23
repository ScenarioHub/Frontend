<template>
  <div class="page">
    <main class="main">
      <div v-if="pending" class="state">불러오는 중...</div>
      <div v-else-if="error || !scenario" class="state error">
        존재하지 않는 시나리오입니다.
      </div>

      <section v-else class="detail">
        <h2 class="title">{{ scenario.title }}</h2>
        <p class="summary">{{ scenario.summary }}</p>

        <div class="meta">
          <span>생성일: {{ formatDate(scenario.createdAt) }}</span>
          <span class="downloads">
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
            {{ scenario.downloadCount }}
          </span>
        </div>

        <button class="back" @click="navigateTo('/my-scenarios')">
          목록으로
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
type Scenario = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  downloadCount: number;
};

const route = useRoute();
const id = computed(() => String(route.params.id)); // /scenarios/:id [web:67]

const {
  data: scenario,
  pending,
  error,
} = await useFetch<Scenario>(() => `/api/my-scenarios/${id.value}`); // route param 기반 fetch [web:23]

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
</script>

<style scoped>
.page {
  min-height: 90vh;
  background: #f5f7fb;
  color: #0f172a;
}
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 16px 40px;
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
.detail {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 18px;
}
.title {
  margin: 0 0 8px;
  font-size: 20px;
}
.summary {
  margin: 0 0 14px;
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
.downloads {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: #334155;
}
.back {
  margin-top: 16px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}
</style>
