<template>
  <ClientOnly>
    <div class="scenario-viewer">
      <div ref="threeContainer" class="three-container">
        <!-- 전체화면 버튼 (우하단 유지) -->
        <button class="fullscreen-btn" type="button" @click="toggleFullscreen">
          <Icon
            :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'"
            :size="18"
          />
        </button>

        <!-- 로딩 오버레이 -->
        <div v-if="isLoading" class="loading-overlay">로딩 중...</div>

        <!-- ✅ 타임바 오버레이 (화면 내부 하단) -->
        <div class="timeline-overlay" :class="{ disabled: !isReady }">
          <!-- 재생/일시정지 -->
          <button class="tl-play-btn" type="button" @click="togglePlay">
            <Icon
              :name="isPlaying ? 'lucide:pause' : 'lucide:play'"
              :size="14"
            />
          </button>

          <!-- 현재 시간 -->
          <span class="tl-time">{{
            formatTime(currentSimulationTimeRef)
          }}</span>

          <!-- 슬라이더 -->
          <div
            class="tl-slider-wrap"
            @mousedown="onSliderMouseDown"
            @touchstart.prevent="onSliderTouchStart"
          >
            <div class="tl-track">
              <div class="tl-fill" :style="{ width: progressPercent + '%' }" />
              <div class="tl-thumb" :style="{ left: progressPercent + '%' }" />
            </div>
          </div>

          <!-- 전체 시간 -->
          <span class="tl-time">{{ formatTime(maxSimulationTime) }}</span>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ViewerData } from "~/types";

// 부모에서 scenarioId를 props로 넘기고 싶으면:
const props = defineProps<{
  scenarioId?: number;
}>();

// 입력창을 이 컴포넌트 내부에서 관리
const scenarioIdLocal = ref<number>(props.scenarioId ?? -1);

// 필요하면 변경사항을 부모로 emit
const emit = defineEmits<{
  (e: "update:scenarioId", value: number): void;
}>();

watch(scenarioIdLocal, (v) => {
  emit("update:scenarioId", v);
});

// --- 타입 정의 ---
interface Position {
  x: number;
  y: number;
  z: number;
  h: number;
}
interface TrajectoryData {
  [time: string]: {
    [id: string]: Position;
  };
}

// --- 변수 선언 ---
const threeContainer = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

let trajectoryData: TrajectoryData | null = null;
let timeKeys: number[] = [];
let currentIndex = 0;
let isCameraInitialized = false;
const previousEgoPosition = new THREE.Vector3();
let previousEgoHeading = 0;

const vehicles: Record<string, THREE.Group | THREE.Object3D> = {};
const prevVehiclePositions: Record<string, THREE.Vector3> = {};
const baseCarModels: Record<string, THREE.Group> = {};

let currentSimulationTime = 0;
let lastTimestamp = 0;
let currentMapModel: THREE.Group | THREE.Object3D | null = null;
let animationFrameId: number | null = null;

const isReady = ref(false);
const isLoading = ref(false);
const isPlaying = ref(true);

const currentSimulationTimeRef = ref(0); // 렌더링용 (animate 루프에서 동기화)
const maxSimulationTime = ref(0); // 전체 길이

// progressPercent: 0~100
const progressPercent = computed(() => {
  if (!maxSimulationTime.value) return 0;
  return Math.min(
    (currentSimulationTimeRef.value / maxSimulationTime.value) * 100,
    100,
  );
});

function formatTime(sec: number) {
  const s = Math.floor(sec);
  const ms = Math.floor((sec - s) * 10);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ms}`;
}

// --- 1. 데이터 불러오기 버튼 클릭 시 ---
const loadData = async () => {
  if (!scenarioIdLocal.value) return;
  isLoading.value = true;
  isReady.value = false;
  try {
    const res = await $fetch<ViewerData>(
      `/nuxt-api/scenarios/${scenarioIdLocal.value}/viewer`,
    );
    const data = res as ViewerData;

    trajectoryData =
      typeof data.scenario === "string"
        ? JSON.parse(data.scenario)
        : data.scenario;

    if (trajectoryData) {
      timeKeys = Object.keys(trajectoryData)
        .map(Number)
        .sort((a, b) => a - b);
    }

    const mapUrl = buildAssetUrl(data.map);
    await loadMap(mapUrl);

    const convertedModels: Record<string, string> = {};
    Object.entries(data.models).forEach(([id, path]) => {
      convertedModels[id] = buildAssetUrl(path);
    });
    await loadCarModels(convertedModels);

    currentSimulationTime = 0;
    currentIndex = 0;
    lastTimestamp = 0;
    isCameraInitialized = false;
    if (trajectoryData) {
      timeKeys = Object.keys(trajectoryData)
        .map(Number)
        .sort((a, b) => a - b);
      // ✅ 추가
      maxSimulationTime.value = timeKeys[timeKeys.length - 1] ?? 0;
    }
    isReady.value = true;
  } catch (error) {
    console.error("데이터 로드 에러 from ScenarioViewer.vue:", error);
  } finally {
    isLoading.value = false;
    isPlaying.value = false;
  }
};

const toggleFullscreen = async () => {
  if (!threeContainer.value) return;

  if (!document.fullscreenElement) {
    await threeContainer.value.requestFullscreen();
    isFullscreen.value = true;
  } else {
    await document.exitFullscreen();
    isFullscreen.value = false;
  }

  lastTimestamp = 0;
  onWindowResize();
  // ✅ 일시정지 중이면 1회 강제 렌더
  if (!isPlaying.value) renderOnce();
};

if (import.meta.client) {
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
    lastTimestamp = 0;
    onWindowResize();
    if (!isPlaying.value) renderOnce();
  });
}

const buildAssetUrl = (path: string) => {
  return `/nuxt-api${path}`;
};

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWindowResize);
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  if (scene) {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }

  if (renderer) renderer.dispose();
});
const hasInitialized = ref(false);

onMounted(() => {
  watch(
    threeContainer,
    (el) => {
      if (!el || hasInitialized.value) return;

      hasInitialized.value = true;
      initThreeJS();
      isPlaying.value = true;
      animationFrameId = requestAnimationFrame(animate);
      window.addEventListener("resize", onWindowResize);
      loadData();
    },
    { immediate: true },
  );
});

const togglePlay = () => {
  if (isPlaying.value) {
    // 일시정지
    isPlaying.value = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else {
    // 다시 재생: 시간 기준 맞춰주고 루프 재시작
    isPlaying.value = true;
    lastTimestamp = 0; // 다음 프레임에서 deltaTime을 자연스럽게 재계산
    animationFrameId = requestAnimationFrame(animate);
  }
};

const initThreeJS = () => {
  if (!threeContainer.value) return;

  const { clientWidth, clientHeight } = threeContainer.value;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(50, 100, 50);
  scene.add(dirLight);

  camera = new THREE.PerspectiveCamera(
    60,
    clientWidth / clientHeight,
    0.1,
    10000,
  );

  // 초기에는 적당한 위치 + 가운데를 바라보게
  camera.position.set(0, 50, 80);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(clientWidth, clientHeight);
  threeContainer.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  // target을 처음엔 원점으로 맞춰두고
  controls.target.set(0, 0, 0);
  controls.update();
};

const loadMap = (mapUrl: string) => {
  const loader = new GLTFLoader();
  return new Promise<void>((resolve, reject) => {
    loader.load(
      mapUrl,
      (gltf) => {
        // scene이 이미 dispose된 드문 경우만 방어
        if (!scene) {
          console.error("Scene disposed before map loaded.");
          resolve();
          return;
        }

        currentMapModel = gltf.scene;
        currentMapModel.rotation.x = -Math.PI / 2;
        scene.add(currentMapModel);
        resolve();
      },
      undefined,
      (err) => {
        console.error("GLTF load error:", err);
        reject(err);
      },
    );
  });
};

const loadCarModels = async (modelsMap: Record<string, string>) => {
  const loader = new GLTFLoader();

  const loadModelAsync = (id: string, path: string) => {
    return new Promise((resolve) => {
      loader.load(path, (gltf) => {
        gltf.scene.rotation.x = -Math.PI / 2;
        const carWrapper = new THREE.Group();
        carWrapper.add(gltf.scene);
        baseCarModels[id] = carWrapper;
        resolve(true);
      });
    });
  };

  const promises = Object.entries(modelsMap).map(([id, url]) => {
    return loadModelAsync(id, url);
  });

  await Promise.all(promises);
};

const animate = (timestamp?: number) => {
  if (isPlaying.value) {
    animationFrameId = requestAnimationFrame(animate);
  }

  const currentTimestamp =
    timestamp !== undefined ? timestamp : performance.now();
  if (lastTimestamp === 0) lastTimestamp = currentTimestamp;

  const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
  lastTimestamp = currentTimestamp;

  if (
    isReady.value &&
    trajectoryData &&
    timeKeys.length > 0 &&
    Object.keys(baseCarModels).length > 0
  ) {
    currentSimulationTime += deltaTime;
    currentSimulationTimeRef.value = currentSimulationTime;

    const maxTime = timeKeys[timeKeys.length - 1] ?? 0;
    if (currentSimulationTime > maxTime) {
      currentSimulationTime = 0;
      currentIndex = 0;
      currentSimulationTimeRef.value = 0;
    }

    while (
      currentIndex < timeKeys.length - 1 &&
      (timeKeys[currentIndex] ?? 0) <= currentSimulationTime
    ) {
      currentIndex++;
    }

    // ✅ 분리된 함수 호출
    updateVehiclePositions();
  }

  if (renderer && scene && camera) {
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
};

const onWindowResize = () => {
  if (!camera || !renderer || !threeContainer.value) return;

  const { clientWidth, clientHeight } = threeContainer.value;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
};
let isDragging = false;

function seekTo(ratio: number) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const target = clamped * maxSimulationTime.value;

  currentSimulationTime = target;
  currentSimulationTimeRef.value = target;

  currentIndex = timeKeys.findIndex((t) => t >= target);
  if (currentIndex === -1) currentIndex = timeKeys.length - 1;

  // ✅ 일시정지 중에도 즉시 화면 갱신
  if (!isPlaying.value) {
    // 차량 위치를 해당 시간으로 먼저 업데이트
    updateVehiclePositions();
    renderOnce();
  }
}

function updateVehiclePositions() {
  if (
    !trajectoryData ||
    timeKeys.length === 0 ||
    Object.keys(baseCarModels).length === 0
  )
    return;

  const currentTimeKey = timeKeys[currentIndex];
  if (currentTimeKey === undefined) return;

  const currentPositions = trajectoryData[String(currentTimeKey)];
  if (!currentPositions) return;

  for (const id in currentPositions) {
    const pos = currentPositions[id];
    if (!pos) continue;

    if (!vehicles[id]) {
      const baseModel = baseCarModels[id] ?? baseCarModels["0"];
      if (!baseModel) continue;
      const clonedCar = SkeletonUtils.clone(baseModel);
      clonedCar.rotation.order = "YZX";
      scene.add(clonedCar);
      vehicles[id] = clonedCar;
    }

    const targetX = pos.x;
    const targetY = pos.z;
    const targetZ = -pos.y;

    if (prevVehiclePositions[id]) {
      const prev = prevVehiclePositions[id];
      const deltaX = targetX - prev.x;
      const deltaY = targetY - prev.y;
      const deltaZ = targetZ - prev.z;
      const dist2D = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      if (dist2D > 0.001) {
        vehicles[id].rotation.z = Math.atan2(deltaY, dist2D);
      }
    }

    vehicles[id].position.set(targetX, targetY, targetZ);
    vehicles[id].rotation.y = pos.h;

    if (!prevVehiclePositions[id]) {
      prevVehiclePositions[id] = new THREE.Vector3();
    }
    prevVehiclePositions[id].set(targetX, targetY, targetZ);
  }

  // 카메라 추적 (ego vehicle "0")
  if (vehicles["0"]) {
    const currentEgoPos = vehicles["0"].position;
    const currentEgoHeading = vehicles["0"].rotation.y;

    if (!isCameraInitialized) {
      const offset = new THREE.Vector3(-15, 8, 10);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentEgoHeading);
      camera.position.copy(currentEgoPos).add(offset);
      if (controls) controls.target.copy(currentEgoPos);
      else camera.lookAt(currentEgoPos);
      previousEgoPosition.copy(currentEgoPos);
      previousEgoHeading = currentEgoHeading;
      isCameraInitialized = true;
    } else {
      camera.position.x += currentEgoPos.x - previousEgoPosition.x;
      camera.position.y += currentEgoPos.y - previousEgoPosition.y;
      camera.position.z += currentEgoPos.z - previousEgoPosition.z;

      let deltaHeading = currentEgoHeading - previousEgoHeading;
      if (deltaHeading > Math.PI) deltaHeading -= Math.PI * 2;
      if (deltaHeading < -Math.PI) deltaHeading += Math.PI * 2;

      if (Math.abs(deltaHeading) > 0.0001) {
        const offsetFromCar = camera.position.clone().sub(currentEgoPos);
        offsetFromCar.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaHeading);
        camera.position.copy(currentEgoPos).add(offsetFromCar);
      }

      if (controls) {
        controls.target.copy(currentEgoPos);
        controls.update();
      } else {
        camera.lookAt(currentEgoPos);
      }

      previousEgoPosition.copy(currentEgoPos);
      previousEgoHeading = currentEgoHeading;
    }
  }
}

function renderOnce() {
  if (!renderer || !scene || !camera) return;
  if (controls) controls.update();
  renderer.render(scene, camera);
}

function getRatioFromEvent(e: MouseEvent | Touch, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return (e.clientX - rect.left) / rect.width;
}

function onSliderMouseDown(e: MouseEvent) {
  if (!isReady.value) return;
  isDragging = true;

  const track = (e.currentTarget as HTMLElement).querySelector(
    ".tl-track",
  ) as HTMLElement;
  seekTo(getRatioFromEvent(e, track));

  const onMove = (ev: MouseEvent) => {
    if (!isDragging) return;
    seekTo(getRatioFromEvent(ev, track));
  };
  const onUp = () => {
    isDragging = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function onSliderTouchStart(e: TouchEvent) {
  if (!isReady.value) return;
  const track = (e.currentTarget as HTMLElement).querySelector(
    ".tl-track",
  ) as HTMLElement;
  const touch = e.touches[0];
  if (touch) seekTo(getRatioFromEvent(touch, track));

  const onMove = (ev: TouchEvent) => {
    const t = ev.touches[0];
    if (t) seekTo(getRatioFromEvent(t, track));
  };
  const onEnd = () => {
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
  };

  window.addEventListener("touchmove", onMove);
  window.addEventListener("touchend", onEnd);
}
</script>

<style scoped>
.scenario-viewer {
  width: 100%;
  height: 100%;
}

/* 이 div가 fullscreen 대상 + 버튼 기준 */
.three-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

/* three-container 기준 우측 상단 */
.fullscreen-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 16; /* timeline-overlay(15)보다 위 */

  width: 26px;
  height: 26px;
  padding: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  color: #e5e7eb;
  font-size: 13px;
  z-index: 20;
}
.play-toggle-btn {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 15;

  width: 32px;
  height: 32px;
  padding: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.4);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  cursor: pointer;
}
/* ─── 타임바 오버레이 ─────────────────────────────────────────── */
.timeline-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 15;

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;

  /* 하단 그라디언트 페이드 */
  background: linear-gradient(
    to top,
    rgba(11, 18, 32, 0.35) 0%,
    rgba(11, 18, 32, 0) 100%
  );

  /* 전체화면 버튼 위에 겹치지 않도록 우측 여백 */
  padding-right: 46px;
}

.timeline-overlay.disabled {
  opacity: 0.35;
  pointer-events: none;
}

/* 타임바 재생 버튼 */
.tl-play-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.tl-play-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* 시간 텍스트 */
.tl-time {
  flex-shrink: 0;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: rgba(255, 255, 255, 0.75);
  min-width: 46px;
  text-align: center;
}

/* 슬라이더 */
.tl-slider-wrap {
  flex: 1;
  padding: 8px 0;
  cursor: pointer;
}

.tl-track {
  position: relative;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}

.tl-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #155dfc;
  border-radius: 999px;
  pointer-events: none;
}

.tl-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #155dfc;
  pointer-events: none;
  transition: transform 0.1s;
}

.tl-slider-wrap:hover .tl-thumb {
  transform: translate(-50%, -50%) scale(1.35);
}
</style>
