import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@vueuse/nuxt",
    "reka-ui/nuxt",
  ],
  devtools: { enabled: true },
  css: [
    "./app/assets/main.css",
  ],
  runtimeConfig: {
    // 서버에서만 접근(비공개)
    apiBase: process.env.API_BASE || "http://localhost:8080", // 여기 api 주소 수정해야함!!!!!!!!!!!!!!!
  },
  compatibilityDate: "2025-07-15",
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        checkJs: true,
        erasableSyntaxOnly: true,
        noErrorTruncation: true,
      },
    },
    sharedTsConfig: {
      compilerOptions: {
        checkJs: true,
        erasableSyntaxOnly: true,
        noErrorTruncation: true,
      },
    },
    nodeTsConfig: {
      compilerOptions: {
        checkJs: true,
        erasableSyntaxOnly: true,
        noErrorTruncation: true,
      },
    },
  },
  eslint: {
    config: {
      stylistic: {
        arrowParens: true,
        braceStyle: "1tbs",
        quotes: "double",
        semi: true,
      },
    },
  },
});
