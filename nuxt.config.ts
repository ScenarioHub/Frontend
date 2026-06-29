import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@vueuse/nuxt",
    "reka-ui/nuxt",
  ],
  devtools: { enabled: true },
  app: {
    head: {
      title: "Scenario Hub", // title이 지정되지 않은 페이지에서 보여질 기본값
      titleTemplate: "%s", // %s 자리에 개별 페이지의 title이 치환됨
    },
  },
  css: [
    "./app/assets/main.css",
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || "https://localhost:7778",
    },
  },
  experimental: {
    appManifest: false,
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
  icon: {
    provider: "none",

    serverBundle: {
      collections: ["lucide"], // lucide 세트 로컬 번들에 포함
    },

    clientBundle: {
      scan: true,
      includeCustomCollections: true,
      sizeLimitKb: 256,
    },
    customCollections: [{
      prefix: "site",
      dir: "./app/assets/custom-icons",
    }],
  },
});
