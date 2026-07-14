<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const { userName } = useAuthState();
const { openLogin } = useAuthModal();

const year = new Date().getFullYear();

const isExplorePage = computed(() => route.path === "/explore");

const headerSearchValue = computed(() => {
  if (!isExplorePage.value) return "";
  return typeof route.query.q === "string" ? route.query.q : "";
});

function handleHeaderSearch(value: string) {
  if (!isExplorePage.value) return;

  const trimmed = value.trim();
  const nextQuery: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(route.query)) {
    if (Array.isArray(rawValue)) {
      if (rawValue[0] != null) nextQuery[key] = String(rawValue[0]);
    } else if (rawValue != null) {
      nextQuery[key] = String(rawValue);
    }
  }

  nextQuery.page = "1";

  if (trimmed) {
    nextQuery.q = trimmed;
  } else {
    delete nextQuery.q;
  }

  router.replace({
    path: "/explore",
    query: nextQuery,
  });
}
</script>

<template>
  <div class="page">
    <PageHeader
      :model-value="headerSearchValue"
      :user-name="userName ?? ''"
      @search="handleHeaderSearch"
      @login="openLogin"
    />

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      &copy; {{ year }} Team ScenarioHub. All rights reserved.
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.main-content {
  flex: 1;
}

.footer {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 13px;
  color: #64748b;
  background: #fff;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}
</style>
