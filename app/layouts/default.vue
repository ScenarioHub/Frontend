<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";

const { q, isLoggedIn, userName } = useHeaderState();
const { isOpen, mode, close, openLogin, openSignup } = useAuthModal();

const { applyLogin, applySignedUp } = useAuthActions();

function onLoggedIn(payload: { userName?: string }) {
  applyLogin(payload);
}
function onSignedUp(payload: { userName?: string }) {
  applySignedUp(payload);
}
</script>

<template>
  <div class="page">
    <PageHeader
      :modelValue="q ?? ''"
      @update:modelValue="q = $event"
      :is-logged-in="isLoggedIn === true"
      :user-name="userName ?? ''"
      @login="openLogin"
    />
    <slot></slot>
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
