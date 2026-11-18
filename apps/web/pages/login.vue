<template>
  <section class="mx-auto max-w-md">
    <p class="font-semibold text-teal-700">
      Acceso
    </p>
    <h1 class="mt-2 text-3xl font-bold text-slate-950">
      Iniciar sesión
    </h1>
    <p class="mt-2 text-slate-600">
      Personal de atención y administradores. Para sacar un turno no necesitas cuenta.
    </p>

    <form class="mt-6 space-y-4 rounded border border-slate-200 bg-white p-6" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Correo</span>
        <input
          v-model="form.email"
          class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="email"
          required
          type="email"
        >
      </label>

      <label class="block">
        <span class="text-sm font-medium text-slate-700">Contraseña</span>
        <input
          v-model="form.password"
          class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="current-password"
          required
          type="password"
        >
      </label>

      <p v-if="auth.error" class="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
        {{ auth.error }}
      </p>

      <button
        class="focus-ring w-full rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
        :disabled="auth.loading"
        type="submit"
      >
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <p class="text-center text-sm text-slate-600">
        ¿No tienes cuenta?
        <NuxtLink class="font-semibold text-teal-700 hover:underline" to="/register">
          Regístrate
        </NuxtLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()

const form = reactive({
  email: '',
  password: ''
})

onMounted(() => {
  auth.error = ''
})

async function submit() {
  try {
    await auth.login(form)
  } catch {
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  await navigateTo(redirect.startsWith('/') ? redirect : auth.homePath)
}
</script>
