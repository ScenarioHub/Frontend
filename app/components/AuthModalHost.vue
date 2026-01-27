<template>
  <div v-if="isOpen" class="backdrop" @mousedown="onBackdropMouseDown" @mouseup="onBackdropMouseUp">
    <LoginModal
      v-if="mode === 'login'"
      @close="close"
      @switch-to-signup="openSignup"
    />
    <SignupModal
      v-else
      @close="close"
      @switch-to-login="openLogin"
    />
  </div>
</template>

<script setup lang="ts">
import LoginModal from "~/components/LoginModal.vue";
import SignupModal from "~/components/SignupModal.vue";

const { isOpen, mode, close, openLogin, openSignup } = useAuthModal();

const isMouseDownOnBackdrop = ref(false);

function onBackdropMouseDown(e: MouseEvent) {
  // 누른 대상(target)이 배경(currentTarget)과 같으면 true (아니면 내부 모달 클릭임)
  if (e.target === e.currentTarget) {
    isMouseDownOnBackdrop.value = true;
  } else {
    isMouseDownOnBackdrop.value = false;
  }
}

function onBackdropMouseUp(e: MouseEvent) {
  // 1. 시작점이 배경이었고
  // 2. 지금 뗀 곳(target)도 배경이어야 함
  if (isMouseDownOnBackdrop.value && e.target === e.currentTarget) {
    close();
  }
  // 로직 종료 후 초기화
  isMouseDownOnBackdrop.value = false;
}
function onKeydown(e: KeyboardEvent) {
  // 모달이 열려있고(isOpen), 누른 키가 ESC(Escape)라면 닫기
  if (isOpen.value && e.key === "Escape") {
    close();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}
</style>
