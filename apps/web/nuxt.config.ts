import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt'
  ],
  app: {
    head: {
      title: 'FilaCero',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Filas virtuales y turnos digitales' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ??
        'http://localhost:4050/api/v1'
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  }
})
