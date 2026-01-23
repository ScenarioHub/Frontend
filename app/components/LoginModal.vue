<template>
  <div class="modal" role="dialog" aria-modal="true" aria-label="로그인">
    <button class="x" type="button" aria-label="닫기" @click="$emit('close')">
      ×
    </button>

    <h2 class="title">로그인</h2>
    <p class="subtitle">Scenario Hub에 오신 것을 환영합니다</p>
    <form @submit.prevent="onLogin">
      <label class="label">이메일</label>
      <input
        v-model="email"
        class="input"
        type="email"
        placeholder="example@email.com"
      >

      <label class="label">비밀번호</label>
      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="비밀번호를 입력하세요"
      >

      <!-- 아이디 또는 비밀번과 틀렸습니다. -->
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button class="primary" type="submit">로그인</button>
    </form>
    <div v-if="false" class="divider">
      <span class="line" />
      <span class="or">또는</span>
      <span class="line" />
    </div>

    <button v-if="false" class="social" type="button" @click="onGoogleLogin">
      <span class="g">G</span>
      <span>Google로 계속</span>
    </button>

    <p class="foot">
      계정이 없으신가요?
      <button class="link" type="button" @click="$emit('switch-to-signup')">
        회원가입
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "switch-to-signup"): void;
  (e: "logged-in"): void;
}>();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const { login, googleLogin } = useAuth();
async function onLogin() {
  try {
    errorMessage.value = "";
    await login({ email: email.value, password: password.value });
    emit("close"); // 모달 닫기
    emit("logged-in");
  } catch {
    errorMessage.value = "아이디 또는 비밀번호가 틀렸습니다.";
  }
}

async function onGoogleLogin() {
  googleLogin();

  // 임시: 구글 로그인 성공 처리
  emit("logged-in");
}
</script>

<style scoped>
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
  border-radius: 999px; /* 가볍게 보이게 둥근 형태 */
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
