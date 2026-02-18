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
          :disabled="isDescriptionDisabled"
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
        <ClientOnly>
          <div
            class="upload-area"
            :class="{
              'is-dragover': isDragOver,
              'has-file': form.file || form.serverFilePath,
              'is-readonly': isFileDisabled,
            }"
            @dragover.prevent="!isFileDisabled && (isDragOver = true)"
            @dragleave.prevent="!isFileDisabled && (isDragOver = false)"
            @drop.prevent="!isFileDisabled && onDrop($event)"
            @click="!isFileDisabled && fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="hidden-input"
              accept=".xosc,.xml"
              :disabled="isFileDisabled"
              @change="onFileChange"
            >
            <template v-if="form.file || form.serverFilePath">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <span class="file-name">
                  {{ form.file?.name || extractFileName(form.serverFilePath) }}
                </span>
                <span v-if="form.file" class="file-size">
                  ({{ (form.file.size / 1024).toFixed(1) }} KB)
                </span>
                <button
                  class="btn-clear-file"
                  type="button"
                  :disabled="isReadonlyFromGenerator"
                  @click.stop="clearFile"
                >
                  삭제
                </button>
              </div>
            </template>

            <template v-else>
              <div class="upload-placeholder">
                <div class="upload-icon">
                  <Icon
                    name="lucide:upload"
                    :size="48"
                    class="text-gray-400"
                  />
                </div>
                <p class="upload-text">파일을 드래그하거나 클릭하여 업로드</p>
                <button class="btn-select" type="button">파일 선택</button>
              </div>
            </template>
          </div>
        </ClientOnly>
      </div>
      <div>
        <div
          class="form-group"
        >
          <label class="label">
            맵 선택 (프리뷰)
            <span class="required">*</span>
            <span class="sub-label">시나리오가 실행될 맵을 선택하세요</span>
          </label>
          <div
            class="map-slider-section"
            :class="{ 'is-readonly': isMapReadonly }"
          >
            <ClientOnly>
              <swiper
                :slides-per-view="1.2"
                :space-between="15"
                :centered-slides="true"
                :loop="isLoopEnabled"
                :centered-slides-bounds="true"
                :pagination="{ clickable: !isMapReadonly }"
                :navigation="!isMapReadonly "
                :initial-slide="setInitialSlide"
                :modules
                class="mySwiper"
                @swiper="onSwiper"
                @slide-change="onSlideChange"
              >
                <swiper-slide v-for="map in maps" :key="map.id">
                  <!-- 슬라이드 전체 컨테이너 -->
                  <div class="slide-container">
                    <!-- 1. 이미지 박스 (여기에 제목과 화살표가 들어감) -->
                    <div class="image-box">
                      <img
                        :src="map.imageUrl || 'https://via.placeholder.com/600x300/e2e8f0/1e293b?text=Map+Preview'"
                        alt="Map Preview"
                        class="slide-img"
                      >

                      <!-- 2. 맵 이름 (좌측 상단 오버레이) -->
                      <div class="map-name-badge">
                        {{ map.name }}
                      </div>
                    </div>

                    <!-- 3. 맵 설명 (박스 아래) -->
                    <div class="map-description">
                      {{ map.description }}
                    </div>
                  </div>
                </swiper-slide>
              </swiper>
            </ClientOnly>
          </div>
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

<script setup lang="ts">
import type SwiperType from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";

import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ApiResponse, DataWithJobIdResponse, MapItem, UploadResponse, UploadResponseFromGenerator } from "~/types";

// 라우터 및 상태 관리
const route = useRoute();
const router = useRouter();
const { isLoggedIn } = useAuthState();

const selectedMapId = ref<number | null>(null);
const maps = ref<MapItem[]>([]);
const modules = [Pagination, Navigation];
const swiperRef = ref<SwiperType | null>(null);

const isReadonlyFromGenerator = ref(false);
const isInitLoading = ref(true);
const isDescriptionDisabled = computed(
  () => isInitLoading.value || isReadonlyFromGenerator.value,
);
const isFileDisabled = computed(
  () => isInitLoading.value || isReadonlyFromGenerator.value,
);
const isMapReadonly = computed(
  () => isInitLoading.value || isReadonlyFromGenerator.value,
);

// 폼 데이터
const form = ref({
  title: "",
  description: "",
  tags: [] as string[],
  file: null as File | null,
  scenarioId: 0,
  jobId: "",
  serverFilePath: "" as string,
});

// UI 상태
const tagInput = ref("");
const isDragOver = ref(false);
const isLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const MAX_TAGS = 5;

onMounted(async () => {
  try {
    isInitLoading.value = true;

    await fetchMaps();

    form.value.jobId = route.query.jobId as string;
    if (form.value.jobId) {
      await loadScenarioData(form.value.jobId); // 여기서 isReadonlyFromGenerator=true
    } else {
      isReadonlyFromGenerator.value = false;
    }

    startEnsureMoveTimer(); // 🔹 여기서만 한 번
  } finally {
    isInitLoading.value = false;
  }
});

watch(
  () => isLoggedIn.value,
  (v) => {
    if (import.meta.client && v !== true) {
      alert("로그아웃하여 홈으로 이동합니다.");
      navigateTo("/");
    }
  },
  { immediate: true },
);

async function fetchMaps() {
  try {
    const data = await $fetch<MapItem[]>("/nuxt-api/scenarios/maps/list");

    if (data && Array.isArray(data)) {
      maps.value = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: `/nuxt-api/scenarios/maps/preview?id=${item.id}`,
      }));
    }
  } catch (err) {
    console.error("fetchMaps 에러:", err);
  }
}
const setInitialSlide = computed(() => {
  if (!selectedMapId.value || maps.value.length === 0) return 0;
  const idx = maps.value.findIndex((m) => m.id === selectedMapId.value);
  return idx === -1 ? 0 : idx;
});
async function loadScenarioData(jobId: string) {
  if (!jobId) return;
  try {
    isLoading.value = true;
    form.value.jobId = jobId;

    const data = await $fetch<DataWithJobIdResponse>(`/nuxt-api/generator/${jobId}/contents/`);
    setInputData(data);
  } catch (e) {
    console.error("데이터 로드 실패", e);
  } finally {
    isLoading.value = false;
  }
};
function setInputData(data: DataWithJobIdResponse) {
  console.log(data);
  selectedMapId.value = data.mapId;
  form.value.description = data.description;
  form.value.scenarioId = data.scenarioId;
  form.value.serverFilePath = data.filePath;
  isReadonlyFromGenerator.value = true;
  // 데이터가 존재하면 (upload에서 넘어왔으면), 일부 입력칸 잠그기?
}
// const isLoopEnabled = computed(() => maps.value.length > 1);
const isLoopEnabled = ref<boolean>(false);
let ensureTimer: number | null = null;

// 목표 인덱스 계산
function getTargetIndex() {
  if (!selectedMapId.value || maps.value.length === 0) return -1;
  return maps.value.findIndex((m) => m.id === selectedMapId.value);
}

// 실제 이동 함수 (slideTo 실패 대비해서 콘솔 찍기)
function moveToSelectedMap() {
  const swiper = swiperRef.value;
  const idx = getTargetIndex();
  if (!swiper || idx < 0) return;

  if ((swiper as SwiperType).slideToLoop && isLoopEnabled.value) {
    swiper.slideToLoop(idx);
  } else {
    swiper.slideTo(idx);
  }
}

// 1) 조건 만족하면 1회 즉시 이동
watch(
  () => ({
    mapsLen: maps.value.length,
    selectedId: selectedMapId.value,
    ready: !!swiperRef.value,
  }),
  async ({ mapsLen, selectedId, ready }) => {
    if (!ready || !selectedId || !mapsLen) return;
    await nextTick();
    moveToSelectedMap();
  },
  { immediate: true },
);

// 2) 초기 1.5초 동안 3번 정도 재시도
function startEnsureMoveTimer() {
  if (ensureTimer) window.clearInterval(ensureTimer);
  let attempts = 0;

  ensureTimer = window.setInterval(() => {
    attempts += 1;
    moveToSelectedMap();
    if (attempts >= 3) {
      if (ensureTimer) window.clearInterval(ensureTimer);
      ensureTimer = null;
    }
  }, 500); // 0.5초 간격으로 3번
}

const onSwiper = (swiper: SwiperType) => {
  swiperRef.value = swiper;
};
const onSlideChange = (swiper: SwiperType) => {
  if (isReadonlyFromGenerator.value) return;
  const index = swiper.realIndex;
  if (maps.value[index]) {
    selectedMapId.value = maps.value[index].id;
  }
};

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

// 유효성 검사
// jobId 없으면 (제목, 설명, 파일이 모두 있어야 함)
// jobId 있으면 (제목만 필수)
const isValid = computed(() => {
  if (!form.value.jobId) {
    return (
      form.value.title.trim() !== ""
      && form.value.description.trim() !== ""
      && form.value.file !== null
      && (form.value.file !== null)
    );
  } else {
    return (
      form.value.title.trim() !== ""
    );
  }
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
function extractFileName(path: string) {
  if (!path) return "";
  return path.split("/").pop() || path;
}
function clearFile() {
  form.value.file = null;
  form.value.serverFilePath = "";
}
// 업로드(제출) 핸들러
async function onSubmit() {
  if (!isValid.value) return;

  const formData = new FormData();
  isLoading.value = true;
  formData.append("title", form.value.title);
  formData.append("tags", form.value.tags.join(","));
  try {
    if (form.value.jobId) {
      // jobId 있으면 여기 실행
      // formData.append("jobId", form.value.jobId);
      const res = await $fetch<ApiResponse<UploadResponseFromGenerator>>(`/nuxt-api/generator/${form.value.jobId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.status === 201) {
        console.log("업로드 성공, ID:", res.message);
        alert("성공적으로 업로드되었습니다!");
        router.replace(`/scenarios/${res.message?.postId}`);
      } else {
        throw new Error("업로드 상태 코드가 201이 아닙니다.");
      }
    } else {
      // 직접 업로드 하는 코드
      formData.append("description", form.value.description);

      // [수정 1] 태그를 JSON 배열이 아닌 CSV(콤마로 구분된 문자열)로 변환
      // 예: ["어린이", "안전"] -> "어린이,안전"
      if (form.value.file) {
        formData.append("file", form.value.file);
      }

      const res = await $fetch<ApiResponse<UploadResponse>>("/nuxt-api/board/upload/", {
        method: "POST",
        body: formData,
      });

      // [수정 3] 응답 처리 로직 변경 (res.id -> res.message.postId)
      if (res.status === 201) {
        console.log("업로드 성공, ID:", res.message?.postId);
        alert("성공적으로 업로드되었습니다!");
        router.replace(`/scenarios/${res.message?.postId}`);
      } else {
        throw new Error("업로드 상태 코드가 201이 아닙니다.");
      }
    }
  } catch (e) {
    console.error("업로드 실패:", e);
    alert("업로드 중 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
}
</script>

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

.input-textarea:disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
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
.upload-area.is-readonly {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
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

/*  */
.map-slider-section {
.map-slider-section {
  width: 100%;
  margin-top: 4px;      /* label과 약간 간격 */
  margin-bottom: 0;     /* form-group가 gap으로 간격 관리 */
  position: relative;
}
}
.map-slider-section.is-readonly {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.5);
}

.map-slider-section.is-disabled {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.5);
}
.disabled-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: transparent;
  cursor: not-allowed;
  pointer-events: auto;
}
.mySwiper {
  width: 100%;
  overflow: hidden;
  min-height: 220px;
}

.slide-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.map-name-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(136, 134, 134, 0.85);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 00;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.map-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  min-height: 1.5em;
  max-width: 90%;
  padding: 0 4px;
  align-self: center;
  font-weight: 500;
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
    width: 40px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0);
    border-radius: 50%; /* 원형 */
    color: #2f6dff; /* 화살표 색상 */
    transition: all 0.2s ease;

    top: 40%;
    transform: translateY(-50%);
    margin: 0;
    z-index: 20;
}

:deep(.swiper-button-prev) {
  left: 12px;
}

:deep(.swiper-button-next) {
  right: 12px;
}

:deep(.swiper-button-prev:after),
:deep(.swiper-button-next:after) {
  font-size: 18px;
  font-weight: 900;
}

:deep(.swiper-button-prev:hover),
:deep(.swiper-button-next:hover) {
  transform: translateY(-50%) scale(1.15); /* 살짝 커짐 */
}

/* 페이지네이션 (점) 위치 */
:deep(.swiper-pagination) {
  bottom: 64px;
}

:deep(.swiper-pagination-bullet) {
  background: #ffffff;
  opacity: 0.8;
}

:deep(.swiper-pagination-bullet-active) {
  background: #2f6dff;
  opacity: 1;
}
:deep(.mySwiper .swiper-slide) {
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0.5;
}
:deep(.mySwiper .swiper-slide-active) {
  opacity: 1;
}
</style>
