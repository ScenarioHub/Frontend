<template>
  <header class="topbar">
    <div class="left">
      <!-- 좌상단 홈 아이콘 -->
      <div class="brand" role="button" tabindex="0" @click="navigateTo('/')">
        <div class="brand-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon-white"
          >
            <path
              d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
            />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
        <span class="brand-text">Scenario Hub</span>
      </div>

      <!-- 네비게이터 -->
      <nav class="menu">
        <NuxtLink to="/explore" class="menu-item">탐색</NuxtLink>
        <!-- is-active 클래스에 넣으면 굵게 -->
        <!-- <NuxtLink
          v-if="isLoggedIn === true"
          to="#"
          class="menu-item"
        >찜</NuxtLink> -->
        <NuxtLink
          v-if="isLoggedIn === true"
          to="/my-scenarios"
          class="menu-item"
        >내 시나리오</NuxtLink>
      </nav>
    </div>

    <div class="right">
      <div v-if="false" class="search">
        <span class="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M16.7 16.7 21 21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>

        <input
          class="search-input"
          :value="modelValue"
          placeholder="시나리오 검색..."
          aria-label="시나리오 검색"
          @input="onInput"
        >
      </div>

      <!-- 로그인 하면 (후) -->
      <template v-if="isLoggedIn === true">
        <button class="btn btn-primary" @click="navigateTo('upload')">
          <span class="btn-icon" aria-hidden="true">
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
              class="lucide lucide-upload mr-2"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m17 8-5-5-5 5" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            </svg>
          </span>
          업로드
        </button>

        <button
          v-if="false"
          class="icon-btn"
          aria-label="알림"
          @click="$emit('notifications')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M13.7 20a2 2 0 0 1-3.4 0"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <button class="avatar" aria-label="사용자 메뉴" @click="onLogout()">
          <span class="avatar-text">{{ userInitial }}</span>
        </button>
      </template>

      <!-- 비로그인 -->
      <template v-else>
        <button class="btn btn-ghost" @click="$emit('login')">
          <span class="btn-icon" aria-hidden="true">
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
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "~/composables/useAuth";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    isLoggedIn?: boolean;
    userName?: string;
  }>(),
  {
    modelValue: "",
    isLoggedIn: false,
    userName: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "notifications"): void;
  // (e: "profile"): void;
  (e: "login"): void;
}>();

const userInitial = computed(() => (props.userName?.[0] ?? "U").toUpperCase());
const { logout } = useAuth();

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | null;
  emit("update:modelValue", target?.value ?? "");
}
function onLogout() {
  logout();
}
</script>

<style scoped>
.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.left {
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 520px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #2f6dff;
  display: grid;
  place-items: center;
}

.brand-text {
  font-weight: 700;
  letter-spacing: -0.2px;
}

.menu {
  display: flex;
  align-items: center;
  gap: 18px;
}

.menu-item {
  color: #334155;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 6px;
}
.menu-item.is-active {
  color: #0f172a;
  font-weight: 700;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Search */
.search {
  position: relative;
  width: 340px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
.search-input {
  width: 100%;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
  padding: 0 12px 0 38px;
  outline: none;
  font-size: 14px;
}

.btn {
  height: 36px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
}

.btn-primary {
  background: #2f6dff;
  color: #fff;
}
.btn-primary:hover {
  background: #1d4ed8; /* 더 진한 블루(= Tailwind blue-700) */
}
/* 로그인 버튼 hover 시 살짝 어두워지게 */
.btn.btn-ghost {
  transition: background-color 0.15s ease, color 0.15s ease, filter 0.15s ease;
  background: #fff;
  border-color: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.btn.btn-ghost:hover {
  background-color: rgba(0, 0, 0, 0.08); /* 더 어둡게: 0.12 ~ 0.16 */
}

.btn-icon {
  display: inline-grid;
  place-items: center;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #0f172a;
}
.icon-btn:hover {
  background: #f1f5f9;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #eef2ff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.avatar-text {
  font-weight: 800;
  color: #334155;
  font-size: 14px;
}

.icon-white {
  color: #fff;
}

@media (max-width: 900px) {
  .left {
    min-width: auto;
  }
  .search {
    width: 220px;
  }
}
@media (max-width: 720px) {
  .menu,
  .search {
    display: none;
  }
}
</style>
