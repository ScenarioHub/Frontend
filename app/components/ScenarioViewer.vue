<template>
  <div class="scenario-viewer">
    <div
      ref="threeContainer"
      class="three-container"
    >
      <button
        class="fullscreen-btn"
        type="button"
        @click="toggleFullscreen"
      >
        <Icon
          :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'"
          :size="20"
        />
      </button>
      <button
        class="play-toggle-btn"
        type="button"
        @click="togglePlay"
      >
        <Icon
          :name="isPlaying ? 'lucide:pause' : 'lucide:play'"
          :size="18"
        />
      </button>
      <div v-if="isLoading" class="loading-overlay">
        로딩 중...
      </div>
    </div>
  </div>
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
// --- 1. 데이터 불러오기 버튼 클릭 시 ---
const loadData = async () => {
  if (!scenarioIdLocal.value) return;
  isLoading.value = true;
  isReady.value = false;
  try {
    const res = await $fetch<ViewerData>(`/nuxt-api/scenarios/${scenarioIdLocal.value}/viewer`);
    const data = res as ViewerData;

    trajectoryData
      = typeof data.scenario === "string"
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
    // 전체화면 진입
    await threeContainer.value.requestFullscreen();
    isFullscreen.value = true;
  } else {
    // 전체화면 해제
    await document.exitFullscreen();
    isFullscreen.value = false;
  }

  // 모드 바뀐 뒤에 사이즈 다시 맞추기
  lastTimestamp = 0;
  onWindowResize();
};

if (import.meta.client) {
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
    lastTimestamp = 0;
    onWindowResize();
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

onMounted(() => {
  initThreeJS();
  isPlaying.value = true;
  animationFrameId = requestAnimationFrame(animate);
  window.addEventListener("resize", onWindowResize);
  loadData();
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

  const currentTimestamp
    = timestamp !== undefined ? timestamp : performance.now();
  if (lastTimestamp === 0) lastTimestamp = currentTimestamp;

  const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
  lastTimestamp = currentTimestamp;

  if (
    isReady.value
    && trajectoryData
    && timeKeys.length > 0
    && Object.keys(baseCarModels).length > 0
  ) {
    currentSimulationTime += deltaTime;

    const maxTime = timeKeys[timeKeys.length - 1] ?? 0;

    if (currentSimulationTime > maxTime) {
      currentSimulationTime = 0;
      currentIndex = 0;
    }

    while (
      currentIndex < timeKeys.length - 1
      && (timeKeys[currentIndex] ?? 0) <= currentSimulationTime
    ) {
      currentIndex++;
    }

    const currentTimeKey = timeKeys[currentIndex];
    if (currentTimeKey !== undefined) {
      const currentPositions = trajectoryData[String(currentTimeKey)];

      if (currentPositions) {
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
              const pitch = Math.atan2(deltaY, dist2D);
              vehicles[id].rotation.z = pitch;
            }
          }

          vehicles[id].position.set(targetX, targetY, targetZ);
          vehicles[id].rotation.y = pos.h;

          if (!prevVehiclePositions[id]) {
            prevVehiclePositions[id] = new THREE.Vector3();
          }
          prevVehiclePositions[id].set(targetX, targetY, targetZ);
        }

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
            const deltaX = currentEgoPos.x - previousEgoPosition.x;
            const deltaY = currentEgoPos.y - previousEgoPosition.y;
            const deltaZ = currentEgoPos.z - previousEgoPosition.z;

            camera.position.x += deltaX;
            camera.position.y += deltaY;
            camera.position.z += deltaZ;

            let deltaHeading = currentEgoHeading - previousEgoHeading;
            if (deltaHeading > Math.PI) deltaHeading -= Math.PI * 2;
            if (deltaHeading < -Math.PI) deltaHeading += Math.PI * 2;

            if (Math.abs(deltaHeading) > 0.0001) {
              const offsetFromCar = camera.position.clone().sub(currentEgoPos);
              offsetFromCar.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                deltaHeading,
              );
              camera.position.copy(currentEgoPos).add(offsetFromCar);
            }

            if (controls) {
              controls.target.copy(currentEgoPos);
              controls.update();
            } else camera.lookAt(currentEgoPos);

            previousEgoPosition.copy(currentEgoPos);
            previousEgoHeading = currentEgoHeading;
          }
        }
      }
    }
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
  right: 8px;
  bottom: 8px;
  z-index: 10;

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
</style>
