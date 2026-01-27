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
    <slot />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    "Noto Sans KR", Apple SD Gothic Neo, "Malgun Gothic", sans-serif;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}
</style>
