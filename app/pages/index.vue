<template>
  <div class="page">
    <main class="main">
      <section class="hero">
        <div class="hero-icon">
          <div class="hero-icon-tile" aria-hidden="true">
            <Icon
              name="site:main-logo"
              :size="56"
              class="text-white"
            />
          </div>
        </div>
        <p class="hero-welcome">Scenario Hub에 오신 것을 환영합니다</p>
        <h1 class="hero-title">
          자율주행 시나리오를 쉽게 생성하고 커뮤니티와 공유하세요
        </h1>
      </section>

      <section class="cards">
        <!-- 시나리오 생성버튼 -->
        <article
          class="card group"
          role="button"
          tabindex="0"
          @click="goGenerator()"
        >
          <div class="card-icon card-blue">
            <Icon
              name="lucide:file-code"
              :size="32"
              class="icon-create"
            />
          </div>
          <h3 class="card-title">시나리오 생성</h3>
          <p class="card-desc">
            자연어로 설명하면 AI가 자동으로 시나리오를 생성합니다
          </p>
        </article>

        <!-- 시나리오 공유 -->
        <article
          class="card group"
          role="button"
          tabindex="0"
          @click="onExploreCommunity"
        >
          <div class="card-icon card-green">
            <Icon
              name="lucide:share-2"
              :size="32"
              class="icon-share"
            />
          </div>
          <h3 class="card-title">시나리오 공유</h3>
          <p class="card-desc">
            커뮤니티에서 공유된 시나리오를 검색하고 다운로드하세요
          </p>
        </article>
      </section>

      <!-- 공유된 시나리오 -->
      <section class="stats">
        <div class="stat">
          <div class="stat-top">
            <Icon
              name="lucide:file-text"
              :size="20"
              class="stat-icon stat-blue"
            />
            <div class="stat-value">{{ sharedScenariosText }}</div>
          </div>
          <div class="stat-label">공유된 시나리오</div>
        </div>

        <!-- 활성 사용자 -->
        <div class="stat">
          <div class="stat-top">
            <Icon
              name="lucide:users"
              :size="20"
              class="stat-icon stat-green"
            />
            <div class="stat-value">{{ activeUsersText }}</div>
          </div>
          <div class="stat-label">활성 사용자</div>
        </div>

        <!-- 총 다운로드 -->
        <div class="stat">
          <div class="stat-top">
            <Icon
              name="lucide:download"
              :size="20"
              class="stat-icon stat-purple"
            />
            <div class="stat-value">{{ totalDownloadsText }}</div>
          </div>
          <div class="stat-label">총 다운로드</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { IndexStats } from "~/types";

const { data } = await useFetch<IndexStats>("/nuxt-api/board/stats");

const sharedScenariosText = computed(() =>
  data.value?.sharedScenarios != null
    ? formatStat(data.value.sharedScenarios)
    : "-",
);
const activeUsersText = computed(() =>
  data.value?.activeUsers != null ? formatStat(data.value.activeUsers) : "-",
);
const totalDownloadsText = computed(() =>
  data.value?.totalDownloads != null
    ? formatStat(data.value.totalDownloads)
    : "-",
);

function goGenerator() {
  navigateTo("/generator");
}
function onExploreCommunity() {
  navigateTo("/explore");
}

function formatStat(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
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
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 16px 40px;
}

/* Hero */
.hero {
  text-align: center;
  margin: 34px 0 34px;
}
.hero-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.hero-icon-tile {
  width: 96px;
  height: 96px;
  border-radius: 18px;
  background: #2f6dff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.hero-welcome {
  margin: 0 0 16px;
  color: #334155;
  font-weight: 600;
}
.hero-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.25;
  letter-spacing: -0.4px;
}

/* Cards */
.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  margin: 32px 0;
}

.card {
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 18px 18px 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
  transition: background-color 0.15s ease;
}

/* create tile */
.card-blue {
  background: rgba(37, 99, 235, 0.12);
}
.card:hover .card-blue {
  background: #2563eb;
}
.icon-create {
  color: #2563eb;
  transition: color 0.15s ease;
}
.card:hover .icon-create {
  color: #fff;
}

/* share tile */
.card-green {
  background: rgba(22, 163, 74, 0.12);
}
.card:hover .card-green {
  background: #16a34a;
}
.icon-share {
  color: #16a34a;
  transition: color 0.15s ease;
}
.card:hover .icon-share {
  color: #fff;
}

.card-title {
  margin: 0 0 6px;
  font-size: 16px;
  letter-spacing: -0.2px;
}
.card-desc {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  overflow: hidden;
}
.stat {
  padding: 18px 10px 16px;
  text-align: center;
}
.stat + .stat {
  border-left: 1px solid rgba(15, 23, 42, 0.08);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.stat-icon {
  opacity: 0.95;
}
.stat-blue {
  color: #155dfc;
}
.stat-green {
  color: #00a63e;
}
.stat-purple {
  color: #9810fa;
}

.stat-value {
  font-weight: 900;
  letter-spacing: -0.3px;
}
.stat-label {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 720px) {
  .cards {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: 1fr;
  }
  .stat + .stat {
    border-left: none;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }
}
</style>
