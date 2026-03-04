<script setup lang="ts">
const { searchQuery: q, userName } = useAuthState();
const { openLogin } = useAuthModal();
</script>

<template>
  <div class="page">
    <PageHeader
      :model-value="q ?? ''"
      :user-name="userName ?? ''"
      @update:model-value="q = $event"
      @login="openLogin"
    />
    <main class="main-content">
      <slot />
    </main>
    <footer class="footer">
      &copy; 2026 Team ScenarioHub. All rights reserved.
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.footer {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}
</style>
