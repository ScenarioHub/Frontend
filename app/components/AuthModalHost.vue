<template>
  <div v-if="isOpen" class="backdrop" @click.self="close">
    <LoginModal
      v-if="mode === 'login'"
      @close="close"
      @logged-in="handleLoginSuccess"
      @switch-to-signup="openSignup"
    />
    <SignupModal
      v-else
      @close="close"
      @signed-up="handleSignUpSuccess"
      @switch-to-login="openLogin"
    />
  </div>
</template>

<script setup lang="ts">
import LoginModal from "~/components/LoginModal.vue";
import SignupModal from "~/components/SignupModal.vue";

const { isOpen, mode, close, openLogin, openSignup } = useAuthModal();
const { handleLoginSuccess, handleSignUpSuccess } = useAuthActions();
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
