<template>
  <div>
    <textarea
      v-model="scenarioId"
      class="textarea"
      style="width: 10%; min-height: 80px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; background-color: #f8fafc; color: #1e293b;"
    />
    <button
      style="padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;"
      @click="loadData()"
    >
      불러오기
    </button>
    <div
      ref="threeContainer"
      class="three-container"
    />
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ViewerData } from "~/types";

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
const scenarioId = ref<string>("");

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

let trajectoryData: TrajectoryData | null = null;
let timeKeys: number[] = [];
let currentIndex: number = 0;
let isCameraInitialized = false;
const previousEgoPosition = new THREE.Vector3();
let previousEgoHeading = 0; // 이전 프레임의 차량 회전값(Y축) 기억용

// 각 차량 인스턴스를 관리하는 객체
const vehicles: Record<string, THREE.Group | THREE.Object3D> = {};
// id별로 이전 위치를 기억하는 객체
const prevVehiclePositions: Record<string, THREE.Vector3> = {};

// 여러 종의 차량 원본(Base) 모델을 미리 담아둘 객체
const baseCarModels: Record<string, THREE.Group> = {};

// 시뮬레이션 현실 시간 측정용 시계
let currentSimulationTime = 0; // 현재 시뮬레이션 재생 시간(초)
let lastTimestamp = 0; // 이전 프레임의 실제 시간(ms) 기억용
let currentMapModel: THREE.Group | THREE.Object3D | null = null;
let animationFrameId: number | null = null;

// --- 1. 데이터 불러오기 버튼 클릭 시 ---
const loadData = async () => {
  if (!scenarioId.value) return;

  try {
    const res = await $fetch<ViewerData>(`/nuxt-api/scenarios/${scenarioId.value}/viewer`);

    const data = res as ViewerData;

    // 1. 궤적 JSON 파싱
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
    loadMap(mapUrl);
    // 3. 차량 모델 로드: Record<string, string> 전체 변환
    const convertedModels: Record<string, string> = {};
    Object.entries(data.models).forEach(([id, path]) => {
      convertedModels[id] = buildAssetUrl(path);
    });
    await loadCarModels(convertedModels);

    // 4. 시뮬레이션 상태 초기화
    currentSimulationTime = 0;
    currentIndex = 0;
    lastTimestamp = 0;
    isCameraInitialized = false;
  } catch (error) {
    console.error("데이터 로드 에러 from test.vue:", error);
  }
};

// 브라우저에서 호출하는 URL (도메인 기준 상대 경로)
const buildAssetUrl = (path: string) => {
  return `/nuxt-api${path}`; // "/nuxt-api/contents/..."
};

onBeforeUnmount(() => {
  // 1. 리사이즈 이벤트 리스너 제거
  window.removeEventListener("resize", onWindowResize);
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  // 2. 씬(Scene) 안에 있는 모든 3D 객체의 메모리(VRAM) 강제 해제
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

  // 3. 렌더러(WebGL 컨텍스트) 해제
  if (renderer) renderer.dispose();
});

// --- 2. 초기 렌더링 시 (Three.js 기본 세팅) ---
onMounted(() => {
  // 1. 빈 씬, 조명, 카메라, 렌더러 세팅
  initThreeJS();

  // 2. Three.js 렌더링 루프 시작 (데이터가 들어오길 백그라운드에서 대기)
  animate();

  // 3. 창 크기 변경 이벤트 리스너 등록
  window.addEventListener("resize", onWindowResize);
});

// --- 1. Three.js 초기 세팅 ---
const initThreeJS = () => {
  if (!threeContainer.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // 맑은 하늘색 배경

  // 조명 설정 (맵과 자동차가 잘 보이도록)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(50, 100, 50);
  scene.add(dirLight);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  // 초기 카메라 위치 (위를 살짝 내려다보는 각도)
  camera.position.set(0, 50, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  threeContainer.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // 마우스 컨트롤 부드럽게
  controls.enablePan = false;
};

// --- 2. 맵 모델 로드 ---
const loadMap = (mapUrl: string) => {
  console.log("mapUrl:", mapUrl);
  const loader = new GLTFLoader();
  loader.load(mapUrl, (gltf) => {
    currentMapModel = gltf.scene;
    currentMapModel.rotation.x = -Math.PI / 2;
    scene.add(currentMapModel);
  }, undefined, (err) => {
    console.error("GLTF load error:", err);
  });
};

// --- 3. 여러 대의 자동차 원본 모델 로드 (Promise) ---
// 매개변수 타입을 Record<string, string>으로 변경
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

  // 객체의 키와 값을 배열 형태로 변환 후 비동기 로드
  // entries => [["0", "/경로/car_white.glt"], ["1", "/경로/car_red.glt"]]
  const promises = Object.entries(modelsMap).map(([id, url]) => {
    return loadModelAsync(id, url);
  });

  await Promise.all(promises);
};

// --- 5. 애니메이션 루프 (실제 시간에 맞춰 렌더링) ---
// 1. 파라미터를 옵셔널(?)로 만들고 기본값을 제거합니다.
const animate = (timestamp?: number) => {
  animationFrameId = requestAnimationFrame(animate);

  // 1. 첫 프레임이거나 timestamp가 안 들어왔을 때 방어
  const currentTimestamp = timestamp !== undefined ? timestamp : performance.now();
  if (lastTimestamp === 0) lastTimestamp = currentTimestamp;

  // 2. 이전 프레임과의 시간 차이(Delta)를 '초' 단위로 계산 (ms -> s)
  const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
  lastTimestamp = currentTimestamp; // 다음 프레임을 위해 저장

  // 단순히 모델 데이터가 하나라도 있으면 실행되도록 수정
  if (trajectoryData && timeKeys.length > 0 && Object.keys(baseCarModels).length > 0) {
    // 3. 시뮬레이션 경과 시간에 Delta를 누적시킵니다.
    currentSimulationTime += deltaTime;

    const maxTime = timeKeys[timeKeys.length - 1] ?? 0;

    // 4. 루프 체크: 시나리오가 끝났다면!
    if (currentSimulationTime > maxTime) {
      currentSimulationTime = 0; // 시간을 0초로 돌림
      currentIndex = 0; // 인덱스도 처음으로
      // [중요] 카메라 각도를 유지하려면 isCameraInitialized = false; 를 절대 넣으면 안 됩니다.
    }

    // 5. 현재 누적된 시뮬레이션 시간에 맞는 데이터를 찾음
    while (
      currentIndex < timeKeys.length - 1
      && (timeKeys[currentIndex] ?? 0) <= currentSimulationTime // < 에서 <= 로 변경하여 더 안정적으로
    ) {
      currentIndex++;
    }

    const currentTimeKey = timeKeys[currentIndex];
    if (currentTimeKey !== undefined) {
      const currentPositions = trajectoryData[String(currentTimeKey)];

      if (currentPositions) {
        // ... (차량 위치 업데이트 및 카메라 추적 로직은 기존과 100% 동일) ...
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

        // Ego 차량 카메라 추적 (기존 코드 그대로)
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
              offsetFromCar.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaHeading);
              camera.position.copy(currentEgoPos).add(offsetFromCar);
            }

            if (controls) {
              controls.target.copy(currentEgoPos);
              controls.update(); // 이거 추가함
            } else camera.lookAt(currentEgoPos);

            previousEgoPosition.copy(currentEgoPos);
            previousEgoHeading = currentEgoHeading;
          }
        }
      }
    }
  }

  // 6. 씬 렌더링 업데이트
  if (renderer && scene && camera) {
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
};

// --- 6. 윈도우 리사이즈 대응 ---
const onWindowResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
};
</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>
