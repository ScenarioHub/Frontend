<template>
  <header class="topbar">
    <div class="left">
      <!-- 좌상단 홈 아이콘 -->
      <div class="brand" role="button" tabindex="0" @click="navigateTo('/')">
        <div class="brand-icon" aria-hidden="true">
          <Icon name="site:main-logo" :size="22" class="text-white" />
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
        <!-- <span class="search-icon" aria-hidden="true">
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
        </span> -->

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
            <Icon
              name="lucide:upload"
              :size="18"
              class="mr-2"
            />
          </span>
          업로드
        </button>

        <Menu as="div" class="relative inline-block text-left">
          <!-- 메뉴 버튼 (아바타) -->
          <MenuButton class="avatar" aria-label="사용자 메뉴">
            <span class="avatar-text">{{ userInitial }}</span>
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
            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <!-- 사용자 정보 (헤더) -->
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-bold text-gray-900">{{ userName || '사용자' }}</p>
                <p class="text-xs text-gray-500 truncate">로그인된 계정</p>
              </div>

              <!-- 메뉴 항목들 -->
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
                    :class="[active ? 'bg-gray-100 text-red-600' : 'text-red-600', 'block w-full text-left px-4 py-2 text-sm']"
                    @click="onLogout"
                  >
                    로그아웃
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </template>

      <!-- 비로그인 -->
      <template v-else>
        <button class="btn btn-ghost" @click="$emit('login')">
          <span class="btn-icon" aria-hidden="true">
            <Icon
              name="lucide:user"
              :size="20"
            />
          </span>
          로그인
        </button>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { computed } from "vue";
import { useAuth } from "~/composables/useAuth";

const { isLoggedIn } = useAuthState();

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    userName?: string;
  }>(),
  {
    modelValue: "",
    userName: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
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
