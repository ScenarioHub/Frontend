<template>
  <div class="modal" role="dialog" aria-modal="true" aria-label="회원가입">
    <button class="x" type="button" aria-label="닫기" @click="$emit('close')">
      ×
    </button>

    <h2 class="title">회원가입</h2>
    <p class="subtitle">Scenario Hub에 참여하세요</p>

    <form @submit.prevent="onSignup">
      <label class="label">이름</label>
      <input
        v-model="name"
        class="input"
        type="text"
        placeholder="이름을 입력하세요"
      >

      <label class="label">이메일</label>
      <input
        v-model="email"
        class="input"
        :class="{ 'input-error': emailError }"
        type="email"
        placeholder="example@email.com"
        autofocus
        @input="emailError = ''"
      >
      <!-- [추가] 이메일 중복 에러 메시지 표시 -->
      <p v-if="emailError" class="field-error">{{ emailError }}</p>

      <label class="label">비밀번호</label>
      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="비밀번호를 입력하세요 (8자 이상)"
      >

      <label class="label">비밀번호 확인</label>
      <input
        v-model="password2"
        class="input"
        type="password"
        placeholder="비밀번호를 다시 입력하세요"
      >
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button
        class="primary"
        type="submit"
        :disabled="!canSubmit"
      >
        회원가입
      </button>
    </form>
    <div v-if="false" class="divider">
      <span class="line" />
      <span class="or">또는</span>
      <span class="line" />
    </div>

    <!-- <button v-if="false" class="social" type="button" @click="onGoogleSignup">
      <span class="g">G</span>
      <span>Google로 계속</span>
    </button> -->

    <p class="foot">
      이미 계정이 있으신가요?
      <button class="link" type="button" @click="$emit('switch-to-login')">
        로그인
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "~/composables/useAuth";
import type { ApiError, Data } from "~/types";

const { register } = useAuth();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "switch-to-login"): void;
  // (e: "signed-up"): void;
}>();

const name = ref("");
const email = ref("");
const password = ref("");
const password2 = ref("");
const errorMessage = ref("");
const emailError = ref(""); // [추가] 이메일 전용 에러 메시지

const canSubmit = computed(() => {
  if (!name.value || !email.value) return false;
  if (password.value.length < 8) return false;
  return true;
});

async function onSignup() {
  errorMessage.value = "";
  emailError.value = "";

  if (password.value !== password2.value) {
    errorMessage.value = "비밀번호가 일치하지 않습니다.";
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = "비밀번호는 8자 이상이어야 합니다.";
    return;
  }

  try {
    await register({ email: email.value, password: password.value, name: name.value });
    emit("close");
  } catch (error) {
    const err = error as ApiError<Data>;

    const errNum = err.statusCode as number;
    const errDataMessage = err.data?.data?.message;
    console.error(`SignupModal.vue ${errNum}, ${errDataMessage}`);

    if (errNum == 400 && (errDataMessage && errDataMessage.includes("이미 존재"))) {
      emailError.value = errDataMessage;
    } else {
      errorMessage.value = errDataMessage || "회원가입 중 오류가 발생했습니다.";
    }
  }
}

// async function onGoogleSignup() {
//   emit("signed-up");
// }
</script>

<style scoped>
/* LoginModal과 동일한 톤 */
.modal {
  width: min(420px, 92vw);
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 22px;
  position: relative;
}

.x {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: #64748b;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
}
.subtitle {
  margin: 6px 0 18px;
  color: #64748b;
  font-weight: 600;
  font-size: 13px;
}

.label {
  display: block;
  margin: 12px 0 8px;
  font-weight: 800;
  color: #0f172a;
  font-size: 13px;
}

.input {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f8fafc;
  padding: 0 12px;
  outline: none;
}
.input:focus {
  box-shadow: 0 0 0 3px rgba(47, 109, 255, 0.15);
  border-color: rgba(47, 109, 255, 0.35);
}

.primary {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: 0;
  border-radius: 12px;
  background: #155dfc;
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  opacity: 1;
}
.primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  margin: 18px 0 12px;
}
.line {
  height: 1px;
  background: rgba(15, 23, 42, 0.12);
}
.or {
  color: #94a3b8;
  font-weight: 800;
  font-size: 12px;
}

.social {
  width: 100%;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 800;
  color: #0f172a;
}
.g {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.06);
  font-weight: 900;
}

.foot {
  margin: 14px 0 0;
  text-align: center;
  color: #64748b;
  font-weight: 700;
  font-size: 13px;
}
.link {
  border: 0;
  background: transparent;
  color: #155dfc;
  font-weight: 900;
  cursor: pointer;
  padding: 0 2px;
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

/* [추가] 필드별 에러 메시지 (작고 빨간 글씨) */
.field-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #ef4444; /* 빨간색 */
  font-weight: 600;
}
/* 전체 에러 메시지 스타일 */
.error {
  margin: 12px 0 0;          /* 위쪽 여백 */
  padding: 10px 12px;        /* 내부 여백 */
  border-radius: 8px;        /* 둥근 모서리 */
  background-color: #fef2f2; /* 연한 빨간 배경 */
  color: #ef4444;            /* 진한 빨간 글씨 */
  font-size: 13px;           /* 적당한 크기 */
  font-weight: 600;          /* 약간 굵게 */
  border: 1px solid #fee2e2; /* 테두리도 살짝 */
  text-align: center;        /* 가운데 정렬 */

  /* 애니메이션 (선택사항: 부드럽게 나타나기) */
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
