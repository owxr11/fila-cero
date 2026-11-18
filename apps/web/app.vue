<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()

onMounted(async () => {
  auth.restoreSession()

  // Refresca los datos del usuario (por si cambió su rol); si la sesión ya no es válida, se limpia
  if (auth.isAuthenticated) {
    await auth.loadMe().catch(() => auth.clearSession())
  }
})
</script>
