// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "nuxt-gtag"],
  nitro: {
    preset: 'bun'
  },
  build: {
    transpile: ['langchain', '@langchain/anthropic', '@langchain/google-genai', '@langchain/openai']
  },
  tailwindcss:{
    config: {
      darkMode: 'class'
    }
  },
  gtag: {
    id: ''
  }
})