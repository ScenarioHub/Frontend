<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ApiResponse, UploadResponse } from "~/types";
// 라우터 및 상태 관리
const route = useRoute();
const router = useRouter();

// 폼 데이터
const form = ref({
  title: "",
  description: "",
  tags: [] as string[],
  file: null as File | null,
  scenarioId: "",
});

// UI 상태
const tagInput = ref("");
const isDragOver = ref(false);
const isLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const MAX_TAGS = 5;

async function loadScenarioData(id: string) {
  if (!id) return;
  try {
    isLoading.value = true;
    form.value.scenarioId = id;

    // 데이터가 존재하면 (upload에서 넘어왔으면), 일부 입력칸 잠그기?

    // 실제 API 연동 시 아래 주석 해제 및 fetch 로직 적용
    // const data = await $fetch(`/api/scenarios/${id}`);
    // form.value.title = data.title || "";
    // form.value.description = data.description || "";
    // form.value.tags = data.tags || [];

    console.log(`ID ${id}에 대한 시나리오 정보를 불러왔습니다.`);
  } catch (e) {
    console.error("데이터 로드 실패", e);
  } finally {
    isLoading.value = false;
  }
};
onMounted(() => {
  const id = route.query.scenarioId as string;
  if (id) {
    loadScenarioData(id);
  }
});

// 태그 추가
function addTag() {
  const val = tagInput.value.trim();
  if (!val) return;

  if (form.value.tags.length >= MAX_TAGS) {
    alert(`태그는 최대 ${MAX_TAGS}개까지만 설정 가능합니다.`);
    return;
  }

  if (!form.value.tags.includes(val)) {
    form.value.tags.push(val);
  }
  tagInput.value = "";
}

// 유효성 검사 (제목, 설명, 파일이 모두 있어야 함)
const isValid = computed(() => {
  return (
    form.value.title.trim() !== ""
    && form.value.description.trim() !== ""
    && form.value.file !== null
  );
});

// 태그 삭제
function removeTag(index: number) {
  form.value.tags.splice(index, 1);
}

// 파일 선택 핸들러
function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    form.value.file = target.files[0] || null;
  }
}

// 드래그 앤 드롭 핸들러
function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    form.value.file = e.dataTransfer.files[0] || null;
  }
}

// 업로드(제출) 핸들러
async function onSubmit() {
  if (!isValid.value) return;

  try {
    isLoading.value = true;

    // 1. FormData 생성
    const formData = new FormData();
    formData.append("title", form.value.title);
    formData.append("description", form.value.description);

    // [수정 1] 태그를 JSON 배열이 아닌 CSV(콤마로 구분된 문자열)로 변환
    // 예: ["어린이", "안전"] -> "어린이,안전"
    formData.append("tags", form.value.tags.join(","));

    if (form.value.scenarioId) {
      // API 명세에 id 필드명이 명시되지 않았으나, 보통 수정 시 필요하므로 유지하거나 명세에 맞게 조정 필요
      // 명세에 없다면 쿼리 파라미터나 다른 방식으로 보낼 수도 있음. 일단 유지.
      formData.append("id", form.value.scenarioId);
    }

    if (form.value.file) {
      formData.append("file", form.value.file);
    }

    const res = await $fetch<ApiResponse<UploadResponse>>("/nuxt-api/scenarios/upload", {
      method: "POST",
      body: formData,
    });

    // [수정 3] 응답 처리 로직 변경 (res.id -> res.message.postId)
    if (res.status === 201) {
      console.log("업로드 성공, ID:", res.message?.postId);
      alert("성공적으로 업로드되었습니다!");
      router.push(`/scenarios/${res.message?.postId}`);
    } else {
      throw new Error("업로드 상태 코드가 201이 아닙니다.");
    }
  } catch (e) {
    console.error("업로드 실패:", e);
    alert("업로드 중 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="page-container">
    <header class="header">
      <h1 class="page-title">시나리오 업로드</h1>
      <p class="page-desc">시나리오를 커뮤니티와 공유하세요</p>
    </header>

    <div class="form-container">
      <!-- 1. 제목 -->
      <div class="form-group">
        <label class="label">시나리오 제목 <span class="required">*</span></label>
        <input
          v-model="form.title"
          type="text"
          class="input-text"
          placeholder="시나리오 제목을 입력하세요"
        >
      </div>

      <!-- 2. 설명 -->
      <div class="form-group">
        <label class="label">시나리오 설명 <span class="required">*</span></label>
        <textarea
          v-model="form.description"
          class="input-textarea"
          placeholder="시나리오에 대한 설명을 입력하세요"
          rows="5"
        />
      </div>

      <!-- 3. 태그 설정 (요청 기능) -->
      <div class="form-group">
        <label class="label">
          태그 설정
          <span class="sub-label">(최대 5개, 엔터로 입력)</span>
        </label>

        <div class="tag-input-wrap">
          <!-- 태그 목록 -->
          <div v-if="form.tags.length > 0" class="tags-list">
            <span v-for="(tag, index) in form.tags" :key="index" class="tag-pill">
              #{{ tag }}
              <button class="tag-remove" type="button" @click="removeTag(index)">×</button>
            </span>
          </div>

          <!-- 입력창 -->
          <input
            v-model="tagInput"
            type="text"
            class="input-text tag-input"
            :placeholder="form.tags.length < MAX_TAGS ? '태그 입력 후 Enter' : '태그 최대 개수에 도달했습니다'"
            :disabled="form.tags.length >= MAX_TAGS"
            @keydown.enter.prevent="addTag"
          >
        </div>
      </div>

      <!-- 4. 파일 업로드 (드래그 앤 드롭) -->
      <div class="form-group">
        <label class="label">시나리오 파일 <span class="required">*</span></label>
        <div
          class="upload-area"
          :class="{ 'is-dragover': isDragOver, 'has-file': form.file }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDrop"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-input"
            accept=".xosc,.xml"
            @change="onFileChange"
          >

          <template v-if="form.file">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ form.file.name }}</span>
              <span class="file-size">({{ (form.file.size / 1024).toFixed(1) }} KB)</span>
              <button class="btn-clear-file" @click.stop="form.file = null">삭제</button>
            </div>
          </template>

          <template v-else>
            <div class="upload-placeholder">
              <div class="upload-icon">
                <!-- 업로드 아이콘 SVG -->
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p class="upload-text">파일을 드래그하거나 클릭하여 업로드</p>
              <button class="btn-select" type="button">파일 선택</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <button
        class="btn btn-submit"
        :class="{ 'is-active': isValid }"
        :disabled="isLoading || !isValid"
        @click="onSubmit"
      >
        {{ isLoading ? '업로드 중...' : '업로드' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 전체 레이아웃 */
.page-container {
  max-width: 800px;
  margin: 60px auto;
  padding: 0 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1e293b;
}

.header {
  margin-bottom: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a; /* 짙은 네이비 */
  margin-bottom: 8px;
}

.page-desc {
  font-size: 16px;
  color: #3b82f6; /* 와이어프레임의 파란색 텍스트 */
  font-weight: 500;
}

/* 폼 스타일 */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.sub-label {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 4px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

/* 입력 필드 공통 */
.input-text,
.input-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #cbd5e1; /* 연한 회색 테두리 */
  border-radius: 8px;
  font-size: 15px;
  background: #fff;
  transition: all 0.2s ease;
  outline: none;
}

.input-text::placeholder,
.input-textarea::placeholder {
  color: #94a3b8;
}

.input-text:focus,
.input-textarea:focus {
  border-color: #3b82f6; /* 포커스 시 파란색 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-textarea {
  resize: vertical;
  min-height: 120px;
}

/* 태그 스타일 */
.tag-input-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  min-height: 50px;
}

.tag-input-wrap:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  background: #eff6ff; /* 매우 연한 파랑 */
  color: #3b82f6;
  font-weight: 600;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 20px;
}

.tag-remove {
  background: none;
  border: none;
  color: #93c5fd;
  margin-left: 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
}
.tag-remove:hover {
  color: #2563eb;
}

.tag-input {
  border: none !important; /* 내부 인풋은 테두리 제거 */
  box-shadow: none !important;
  padding: 6px !important;
  flex: 1;
  min-width: 120px;
}

/* 파일 업로드 영역 */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  margin-bottom: 4px;
}

.upload-text {
  font-size: 14px;
  color: #64748b;
}

.btn-select {
  margin-top: 8px;
  padding: 8px 16px;
  background: #dbeafe; /* 연한 파랑 배경 */
  color: #2563eb;     /* 진한 파랑 글씨 */
  font-weight: 600;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

/* 파일 선택됨 상태 */
.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #0f172a;
  font-weight: 500;
}
.btn-clear-file {
  font-size: 12px;
  color: #ef4444;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 8px;
}

/* 하단 버튼 액션 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background: #fff;
  border-color: #cbd5e1;
  color: #64748b;
}
.btn-cancel:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* 기본 상태 (비활성 - 회색) */
.btn-submit {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed; /* 비활성 시 마우스 커서 */
}

/* 활성화 상태 (파란색) */
.btn-submit.is-active {
  background: #2f6dff;
  color: #fff;
  cursor: pointer;
}
/* 활성화 상태 + 호버 */
.btn-submit.is-active:hover {
  background: #1d4ed8;
}
/* 로딩 중일 때 (활성 상태여도 클릭 방지 느낌) */
.btn-submit:disabled {
  opacity: 0.7;
}
</style>
