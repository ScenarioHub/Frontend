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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Environment, ViewerData } from "~/types";

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

// == 날씨
let ambientLight: THREE.AmbientLight;
let dirLight: THREE.DirectionalLight;
let hemiLight: THREE.HemisphereLight;
let weatherParticles: THREE.Points | THREE.LineSegments | null = null;

let currentEnvironment: Environment | null = null;

const sunGeo = new THREE.SphereGeometry(72, 24, 24);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
let sunMesh: THREE.Mesh | null = null;

// ==

// progressPercent: 0~100
const progressPercent = computed(() => {
  if (!maxSimulationTime.value) return 0;
  return Math.min(
    (currentSimulationTimeRef.value / maxSimulationTime.value) * 100,
    100,
  );
});

function toNumberOrNull(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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
    currentEnvironment = data.Environment ?? null;

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

    if (trajectoryData) {
      timeKeys = Object.keys(trajectoryData)
        .map(Number)
        .sort((a, b) => a - b);
    }

    const initialIndex = findInitialFrameIndex();
    const initialTime = timeKeys[initialIndex] ?? 0;

    currentIndex = initialIndex;
    currentSimulationTime = initialTime;
    currentSimulationTimeRef.value = initialTime;
    maxSimulationTime.value = timeKeys[timeKeys.length - 1] ?? 0;

    lastTimestamp = 0;
    isCameraInitialized = false;

    isReady.value = true;
    isPlaying.value = false;

    // 최초 유효 프레임 기준으로 차량/카메라 배치
    updateVehiclePositions();

    // OrbitControls target 반영
    if (controls) controls.update();

    // 날씨 적용
    applyEnvironmentToScene(currentEnvironment);

    // 첫 화면 즉시 렌더
    renderOnce();
  } catch (error) {
    console.error("데이터 로드 에러 from ScenarioViewer.vue:", error);
  } finally {
    isLoading.value = false;
  }
};

// ====================== 날씨 ==================
function applyEnvironmentToScene(env: Environment | null) {
  if (!scene) return;

  clearWeatherParticles();
  applyDefaultEnvironment();

  if (!env) return;

  applyTimeOfDay(env);
  applyWeather(env);
  applyRoadCondition(env);
}

function applyDefaultEnvironment() {
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = null;

  if (ambientLight) ambientLight.intensity = 1.0;
  if (hemiLight) {
    hemiLight.intensity = 0.6;
    hemiLight.color.set(0xbfdcff);
    hemiLight.groundColor.set(0x5f666d);
  }

  if (dirLight) {
    dirLight.intensity = 1.2;
    dirLight.color.set(0xffffff);
    dirLight.position.set(50, 100, 50);
    dirLight.target.position.set(0, 0, 0);
  }
  // sunMesh.position.copy(dirLight.position.clone().normalize().multiplyScalar(500));
  // scene.add(sunMesh);
}
function applyTimeOfDay(env: Environment) {
  const dateTime = env.TimeOfDay?.dateTime;

  if (!dateTime) return;

  const hour = new Date(dateTime).getHours();

  if (hour >= 6 && hour < 18) {
    scene.background = new THREE.Color(0x87ceeb);

    if (ambientLight) ambientLight.intensity = 1.0;
    if (hemiLight) hemiLight.intensity = 0.6;
    if (dirLight) dirLight.intensity = Math.max(dirLight.intensity, 1.0);
  } else {
    scene.background = new THREE.Color(0x0f172a);

    if (ambientLight) ambientLight.intensity = 0.35;
    if (hemiLight) hemiLight.intensity = 0.2;
    if (dirLight) dirLight.intensity = 0.25;
  }
}
function applyWeather(env: Environment) {
  const weather = env.Weather;
  if (!weather) return;

  applyCloudCover(weather.fractionalCloudCover);
  applySun(weather.Sun);
  applyFog(weather.Fog?.visualRange);
  applyPrecipitation(weather.Precipitation, weather.Wind);
}

function applyCloudCover(cloudCover: string | null | undefined) {
  if (!cloudCover) return;

  if (cloudCover === "zeroOktas") {
    scene.background = new THREE.Color(0x87ceeb);
    if (ambientLight) ambientLight.intensity *= 1.0;
    if (hemiLight) hemiLight.intensity *= 1.0;
    return;
  }

  scene.background = new THREE.Color(0xb8c0c8);
  if (ambientLight) ambientLight.intensity *= 0.85;
  if (hemiLight) hemiLight.intensity *= 0.9;
  if (dirLight) dirLight.intensity *= 0.8;
}

function applySun(
  sun:
    | {
      azimuth: string | null;
      elevation: string | null;
      illuminance: string | null;
    }
    | null
    | undefined,
) {
  if (!dirLight) return;

  const azimuth = toNumberOrNull(sun?.azimuth);
  const elevation = toNumberOrNull(sun?.elevation);
  const illuminance = toNumberOrNull(sun?.illuminance);

  // null이면 태양/태양광 둘 다 숨김 또는 최소화
  if (azimuth == null || elevation == null) {
    dirLight.intensity = 0.0;
    if (sunMesh) sunMesh.visible = false;
    return;
  }

  const radius = 1200;
  const x = Math.cos(elevation) * Math.cos(azimuth) * radius;
  const y = Math.sin(elevation) * radius;
  const z = Math.cos(elevation) * Math.sin(azimuth) * radius;

  dirLight.position.set(x, y, z);
  dirLight.target.position.set(0, 0, 0);

  if (illuminance != null) {
    dirLight.intensity = Math.max(0.1, Math.min(2.0, illuminance / 5));
  }

  if (sunMesh) {
    sunMesh.visible = y > 0;
    sunMesh.position.set(x, y, z);
    sunMesh.scale.setScalar(1);
  }
}

function applyFog(visualRangeValue: string | null | undefined) {
  const visualRange = toNumberOrNull(visualRangeValue);

  if (visualRange == null || visualRange <= 0) {
    scene.fog = null;
    return;
  }

  const far = Math.max(100, visualRange);
  const near = Math.max(10, far * 0.15);

  scene.fog = new THREE.Fog(0xdbe7f2, near, far);
}

function applyPrecipitation(
  precipitation:
    | {
      precipitationIntensity: string | null;
      precipitationType: string | null;
    }
    | null
    | undefined,
  wind:
    | {
      direction: string | null;
      speed: string | null;
    }
    | null
    | undefined,
) {
  if (!precipitation?.precipitationType) return;

  const type = precipitation.precipitationType;
  const intensity = toNumberOrNull(precipitation.precipitationIntensity) ?? 0;

  if (intensity <= 0) return;

  if (type === "snow") {
    createSnowParticles(intensity, wind);
  } else if (type === "rain") {
    createRainParticles(intensity, wind);
  }
}
function createSnowParticles(
  intensity: number,
  wind:
    | {
      direction: string | null;
      speed: string | null;
    }
    | null
    | undefined,
) {
  const snowConfig = getSnowConfig(intensity);

  const count = snowConfig.count;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  const windDirection = toNumberOrNull(wind?.direction) ?? 0;
  const windSpeedRaw = toNumberOrNull(wind?.speed) ?? 0;
  const windSpeed = Math.min(60, windSpeedRaw * 0.1);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 300;
    positions[i * 3 + 1] = Math.random() * 80 + 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

    velocities[i * 3 + 0] = Math.cos(windDirection) * windSpeed;
    velocities[i * 3 + 1] = -(0.2 + Math.random() * 1.0);
    velocities[i * 3 + 2] = Math.sin(windDirection) * windSpeed;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: snowConfig.opacity,
    depthWrite: false,
    sizeAttenuation: true,
  });

  weatherParticles = new THREE.Points(geometry, material);
  scene.add(weatherParticles);
}
function clearWeatherParticles() {
  if (!weatherParticles) return;

  scene.remove(weatherParticles);
  weatherParticles.geometry.dispose();

  if (Array.isArray(weatherParticles.material)) {
    weatherParticles.material.forEach((m) => m.dispose());
  } else {
    weatherParticles.material.dispose();
  }

  weatherParticles = null;
}

function updateWeather(deltaTime: number) {
  if (!weatherParticles) return;

  if (weatherParticles && vehicles["0"]) {
    const ego = vehicles["0"];
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      ego.rotation.y,
    );

    weatherParticles.position.copy(ego.position).add(forward.multiplyScalar(20));
  }

  const type = getPrecipitationType();

  if (type === "rain" && weatherParticles instanceof THREE.LineSegments) {
    updateRain(deltaTime);
  } else if (type === "snow" && weatherParticles instanceof THREE.Points) {
    updateSnow(deltaTime);
  }
}

function updateSnow(deltaTime: number) {
  if (!(weatherParticles instanceof THREE.Points)) return;

  const positions = weatherParticles.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const velocities = weatherParticles.geometry.getAttribute(
    "velocity",
  ) as THREE.BufferAttribute;

  const intensity = getPrecipitationIntensity();
  const snowConfig = getSnowConfig(intensity);
  const range = 100;

  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i);
    let y = positions.getY(i);
    let z = positions.getZ(i);

    const vx = velocities.getX(i);
    const vy = velocities.getY(i);
    const vz = velocities.getZ(i);

    x += vx * deltaTime * 60;
    y += vy * deltaTime * 20;
    z += vz * deltaTime * 60;

    if (Math.abs(x) > range || Math.abs(z) > range || y < 0) {
      x = (Math.random() - 0.5) * range * 2;
      z = (Math.random() - 0.5) * range * 2;

      if (Math.random() < snowConfig.upperSpawnRatio) {
        y = Math.random() * 80 + 20;
      } else {
        y = Math.random() * 18 + 6;
      }
    }

    positions.setXYZ(i, x, y, z);
  }

  positions.needsUpdate = true;
}
function updateRain(deltaTime: number) {
  if (!(weatherParticles instanceof THREE.LineSegments)) return;

  const positions = weatherParticles.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const velocities = weatherParticles.geometry.getAttribute(
    "velocity",
  ) as THREE.BufferAttribute;

  const range = 80;
  const dropLength = 1.8;

  for (let i = 0; i < velocities.count; i++) {
    let x = positions.getX(i * 2);
    let y = positions.getY(i * 2);
    let z = positions.getZ(i * 2);

    const vx = velocities.getX(i);
    const vy = velocities.getY(i);
    const vz = velocities.getZ(i);

    const moveFactor = 12; // 10 → 12~15 정도

    x += vx * deltaTime * moveFactor;
    y += vy * deltaTime * moveFactor;
    z += vz * deltaTime * moveFactor;

    if (Math.abs(x) > range || Math.abs(z) > range || y < 0) {
      x = (Math.random() - 0.5) * range * 2;
      y = Math.random() * 80 + 20;
      z = (Math.random() - 0.5) * range * 2;
    }

    positions.setXYZ(i * 2, x, y, z);
    positions.setXYZ(
      i * 2 + 1,
      x + vx * 0.2,
      y - dropLength,
      z + vz * 0.2,
    );
  }

  positions.needsUpdate = true;
}

function createRainParticles(
  intensity: number,
  wind:
    | {
      direction: string | null;
      speed: string | null;
    }
    | null
    | undefined,
) {
  const rainConfig = getRainConfig(intensity);
  const count = rainConfig.count;

  const positions = new Float32Array(count * 2 * 3);
  const velocities = new Float32Array(count * 3);

  const windDirection = toNumberOrNull(wind?.direction) ?? 0;
  const windSpeedRaw = toNumberOrNull(wind?.speed) ?? 0;
  const windSpeed = Math.min(30, windSpeedRaw * 1.2);

  const windX = Math.cos(windDirection) * windSpeed;
  const windZ = Math.sin(windDirection) * windSpeed;

  const range = 80;
  const dropLength = 1.8;

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * range * 2;
    const y = Math.random() * 80 + 20;
    const z = (Math.random() - 0.5) * range * 2;

    const i6 = i * 6;
    positions[i6 + 0] = x;
    positions[i6 + 1] = y;
    positions[i6 + 2] = z;

    const lateralFactor = 0.2; // 0.15 → 0.2~0.3 정도로 키우기
    const velocityFactor = 0.5; // 0.15 → 0.2~0.3 정도로 키우기

    positions[i6 + 3] = x + windX * lateralFactor;
    positions[i6 + 4] = y - dropLength;
    positions[i6 + 5] = z + windZ * lateralFactor;

    velocities[i * 3 + 0] = windX * velocityFactor;
    velocities[i * 3 + 1] = -(2 + Math.random() * 5);
    velocities[i * 3 + 2] = windZ * velocityFactor;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xaad4ff,
    transparent: true,
    opacity: 0.5,
  });

  weatherParticles = new THREE.LineSegments(geometry, material);
  scene.add(weatherParticles);
}

function getPrecipitationIntensity(): number {
  return toNumberOrNull(
    currentEnvironment?.Weather?.Precipitation?.precipitationIntensity,
  ) ?? 0;
}

function getSnowConfig(intensity: number) {
  if (intensity < 0.25) {
    return { count: 150, upperSpawnRatio: 0.8, opacity: 0.65 };
  }
  if (intensity < 1.0) {
    return { count: 300, upperSpawnRatio: 0.75, opacity: 0.72 };
  }
  if (intensity < 2.5) {
    return { count: 600, upperSpawnRatio: 0.7, opacity: 0.8 };
  }
  if (intensity < 10.0) {
    return { count: 1200, upperSpawnRatio: 0.65, opacity: 0.88 };
  }
  if (intensity < 25.0) {
    return { count: 2200, upperSpawnRatio: 0.6, opacity: 0.92 };
  }
  return { count: 3200, upperSpawnRatio: 0.55, opacity: 0.96 };
}

function getRainConfig(intensity: number) {
  if (intensity < 1.0) return { count: 400 };
  if (intensity < 3.0) return { count: 800 };
  if (intensity < 7.5) return { count: 1600 };
  if (intensity < 20.0) return { count: 2600 };
  return { count: 3600 };
}

function getPrecipitationType(): string | null {
  return currentEnvironment?.Weather?.Precipitation?.precipitationType ?? null;
}

function applyRoadCondition(env: Environment) {
  if (!currentMapModel) return;

  const wetness = env.RoadCondition?.wetness;
  if (!wetness) return;

  const isWet = wetness === "wetWithPuddles";

  currentMapModel.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((mat) => {
      if (!("roughness" in mat) || !("metalness" in mat)) return;

      if (isWet) {
        mat.roughness = 0.2;
        mat.metalness = 0.15;
      } else {
        mat.roughness = 0.9;
        mat.metalness = 0.0;
      }

      mat.needsUpdate = true;
    });
  });
}
// ========================================

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
  clearWeatherParticles();
});
const hasInitialized = ref(false);

onMounted(() => {
  watch(
    threeContainer,
    (el) => {
      if (!el || hasInitialized.value) return;

      hasInitialized.value = true;
      initThreeJS();
      window.addEventListener("resize", onWindowResize);
      loadData();

      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    },
    { immediate: true },
  );
});

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  lastTimestamp = 0;
};

const initThreeJS = () => {
  if (!threeContainer.value) return;

  const { clientWidth, clientHeight } = threeContainer.value;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(0xbfdcff, 0x5f666d, 0.6);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(50, 100, 50);
  dirLight.target.position.set(0, 0, 0);
  scene.add(dirLight);
  scene.add(dirLight.target);

  sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.visible = false;
  scene.add(sunMesh);

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
  animationFrameId = requestAnimationFrame(animate);

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
    if (isPlaying.value) {
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

      currentSimulationTimeRef.value = currentSimulationTime;
      updateVehiclePositions();
      updateWeather(deltaTime);
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
let isDragging = false;

function seekTo(ratio: number) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const target = clamped * maxSimulationTime.value;

  currentSimulationTime = target;
  currentSimulationTimeRef.value = target;

  currentIndex = timeKeys.findIndex((t) => t >= target);
  if (currentIndex === -1) currentIndex = timeKeys.length - 1;

  isCameraInitialized = false;
  updateVehiclePositions();
}

function findInitialFrameIndex() {
  if (!trajectoryData || timeKeys.length === 0) return 0;

  // 1순위: ego vehicle "0"가 있는 첫 프레임
  const egoIndex = timeKeys.findIndex((time) => {
    const frame = trajectoryData?.[String(time)];
    return !!frame?.["0"];
  });
  if (egoIndex !== -1) return egoIndex;

  // 2순위: 차량이 하나라도 있는 첫 프레임
  const firstVehicleIndex = timeKeys.findIndex((time) => {
    const frame = trajectoryData?.[String(time)];
    return !!frame && Object.keys(frame).length > 0;
  });
  if (firstVehicleIndex !== -1) return firstVehicleIndex;

  return 0;
}

function updateVehiclePositions() {
  if (
    !trajectoryData
    || timeKeys.length === 0
    || Object.keys(baseCarModels).length === 0
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

  // ✅ OrbitControls가 슬라이더 드래그를 카메라 회전으로 잘못 인식하지 않도록
  if (controls) controls.enabled = false;

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
    // ✅ 드래그 종료 후 OrbitControls 재활성화
    if (controls) controls.enabled = true;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function onSliderTouchStart(e: TouchEvent) {
  if (!isReady.value) return;

  // ✅ OrbitControls 비활성화
  if (controls) controls.enabled = false;

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
    // ✅ 터치 종료 후 OrbitControls 재활성화
    if (controls) controls.enabled = true;
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
