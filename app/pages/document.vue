<template>
  <div class="slider-wrapper">
    <!-- 배경 꾸밈 (선택) -->
    <div class="background-glow" />

    <div class="slider-container">
      <!-- 커스텀 이전 버튼 -->
      <button class="nav-btn prev-btn" aria-label="Previous Slide" @click="slidePrev">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <!-- Swiper 컴포넌트 -->
      <swiper
        :effect="'coverflow'"
        :grab-cursor="true"
        :centered-slides="true"
        :slides-per-view="'auto'"
        :loop="true"
        :speed="400"
        :slide-to-clicked-slide="true"

        :prevent-clicks="false"

        :prevent-clicks-propagation="false"
        :coverflow-effect="{
          rotate: 0,
          stretch: 80,
          depth: 350,
          modifier: 1,
          slideShadows: false,
          scale: 0.85,
        }"

        :modules
        class="mySwiper"
        @swiper="onSwiper"
      >
        <swiper-slide v-for="(movie, index) in movies" :key="index">
          <div class="movie-card">
            <div class="card-content">
              <h2>{{ movie.title }}</h2>
              <p>{{ movie.desc }}</p>
            </div>
            <div class="card-footer">
              <span>View Details</span>
            </div>
          </div>
        </swiper-slide>
      </swiper>

      <!-- 커스텀 다음 버튼 -->
      <button class="nav-btn next-btn" aria-label="Next Slide" @click="slideNext">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
// 1. SwiperClass 타입을 가져옵니다 (Swiper 인스턴스의 본체)
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import { Swiper, SwiperSlide } from "swiper/vue";

import "swiper/css";
import "swiper/css/effect-coverflow";

export default {
  name: "MovieCarousel",
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    // 2. ref 생성 시 타입을 명시합니다. (초기값은 null이지만 SwiperClass가 들어올 것이다)
    const swiperInstance = ref<SwiperClass | null>(null);

    // 3. 매개변수 swiper에도 타입을 지정합니다 (any로 퉁쳐도 되지만 SwiperClass가 정석)
    const onSwiper = (swiper: SwiperClass) => {
      swiperInstance.value = swiper;
    };

    const slidePrev = () => {
      // 이제 swiperInstance가 null이 아니면 slidePrev가 있다고 인식합니다.
      swiperInstance.value?.slidePrev(400);
    };

    const slideNext = () => {
      swiperInstance.value?.slideNext(400);
    };

    const movies = [
      {
        title: "Guardians Of The Galaxy",
        desc: "A group of intergalactic criminals must pull together to stop a fanatical warrior with plans to purge the universe.",
      },
      {
        title: "Justice League",
        desc: "Determined to ensure Superman's ultimate sacrifice was not in vain, Bruce Wayne aligns forces with Diana Prince.",
      },
      {
        title: "Spider-Man: No Way Home",
        desc: "Following the events of Avengers: Endgame, Spider-Man must step up to take on new threats in a world that has changed forever.",
      },
      {
        title: "The Suicide Squad",
        desc: "Supervillains Harley Quinn, Bloodsport, Peacemaker and a collection of nutty cons at Belle Reve prison join the super-secret Task Force X.",
      },
      {
        title: "Thor: Ragnarok",
        desc: "Imprisoned on the planet Sakaar, Thor must race against time to return to Asgard and stop Ragnarök, the destruction of his world.",
      },
      {
        title: "Doctor Strange in the Multiverse of Madness",
        desc: "America Chavez and a version of Stephen Strange are chased by a demon in the space between universes while searching for the Book of Vishanti.",
      },
      {
        title: "Eternals",
        desc: "In 5000 BC, ten superpowered Eternals are sent by the Celestial Arishem to Earth on their starship, the Domo, to exterminate the invasive Deviants.",
      },
      {
        title: "The Batman",
        desc: "When a sadistic serial killer begins murdering key political figures in Gotham, the Batman is forced to investigate the city's hidden corruption.",
      },
      {
        title: "Black Panther: Wakanda Forever",
        desc: "The people of Wakanda fight to protect their home from intervening world powers as they mourn the death of King T'Challa.",
      },
      {
        title: "Avatar: The Way of Water",
        desc: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns, Jake must work with Neytiri.",
      },
    ];

    return {
      modules: [EffectCoverflow],
      movies,
      onSwiper,
      slidePrev,
      slideNext,
    };
  },
};
</script>

<style scoped>
/* 전체 페이지 배경 */
.slider-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f0f0f;
  overflow: hidden;
  position: relative;
}

.background-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(74, 144, 226, 0.1) 0%, rgba(0,0,0,0) 70%);
  pointer-events: none;
}

/* 슬라이더 컨테이너 */
.slider-container {
  position: relative;
  width: 100%;
  max-width: 1400px;
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 네비게이션 버튼 */
.nav-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  backdrop-filter: blur(5px);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.prev-btn { left: 40px; }
.next-btn { right: 40px; }

/* Swiper 본체 */
.mySwiper {
  width: 100%;
  padding-top: 50px;
  padding-bottom: 50px;
}

/* 슬라이드 애니메이션 튜닝 (핵심) */
.swiper-slide {
  width: 400px;
  height: 550px;

  /* 기본적으로 흐리고 어둡게 */
  filter: blur(5px) brightness(0.5);
  opacity: 0;
  visibility: hidden;

  /* 트랜지션: 모든 변화를 부드럽게 */
  transition:
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    visibility 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* 필터 변화도 트랜지션 추가 */

  pointer-events: none;
}

/* 활성 및 주변 슬라이드 노출 */
.swiper-slide-active,
.swiper-slide-prev,
.swiper-slide-next {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.swiper-slide-active {
  /* 완전 선명하고 밝게 */
  filter: blur(0px) brightness(1.0); /* 살짝 더 밝게(1.2) 해서 강조 */
  opacity: 1;
  visibility: visible;
  z-index: 10;
  pointer-events: auto;

  /* 살짝 떠오르는 느낌 (선택사항) */
  /* transform: scale(1.05); */
}
.swiper-slide-prev,
.swiper-slide-next {
  /* 적당히 흐리고 어둡게 유지 (위의 기본값보다는 잘 보여야 함) */
  filter: blur(3px) brightness(0.65);
  opacity: 0.7; /* 약간 반투명하게 */
  visibility: visible;
  z-index: 5;
  pointer-events: auto;
}

/* 부드러운 합류 애니메이션 */

.swiper-slide-next + .swiper-slide {
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 2. Prev의 이전 요소 (:has 사용) */
/* 해석: "내 바로 뒤(+)에 .swiper-slide-prev가 있는 .swiper-slide" */
.swiper-slide:has(+ .swiper-slide-prev) {
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Swiper 기본 그림자 제거 */
.swiper-slide-shadow-left,
.swiper-slide-shadow-right,
.swiper-slide-shadow-coverflow {
  background: none !important;
  opacity: 0 !important;
  display: none !important;
}

/* 카드 디자인 */
.movie-card {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1e1e24, #18181d);
  border-radius: 20px;
  padding: 30px;
  box-sizing: border-box;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  position: relative;
}

.card-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 15px 0;
  line-height: 1.2;
}

.card-content p {
  font-size: 1rem;
  color: #a0a0a0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 6;
   line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  margin-top: 20px;
  font-size: 0.9rem;
  color: #4a90e2;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .swiper-slide { width: 280px; height: 400px; }
  .nav-btn { width: 40px; height: 40px; }
  .prev-btn { left: 10px; }
  .next-btn { right: 10px; }
  .card-content h2 { font-size: 1.5rem; }
}
</style>
