export default defineNuxtConfig({
    modules: ['@pinia/nuxt'],
    devServer: { port: 3001 },
    runtimeConfig: {
        public: {
            apiUrl: '',
            firebaseApiKey: '',
            firebaseAuthDomain: '',
            firebaseProjectId: '',
            firebaseAppId: ''
        }
    }
})