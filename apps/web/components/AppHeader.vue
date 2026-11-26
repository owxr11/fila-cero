<template>
  <header class="border-b border-slate-200 bg-white">
    <nav
      class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      aria-label="Navegación principal"
    >
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-slate-950">
        <span class="grid size-9 place-items-center rounded bg-teal-600 text-white">
          F0
        </span>
        <span>FilaCero</span>
      </NuxtLink>

      <div class="flex flex-wrap items-center gap-2 text-sm">
        <NuxtLink class="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100" to="/">
          Sacar turno
        </NuxtLink>

        <NuxtLink class="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100" to="/board">
          Tablero
        </NuxtLink>

        <NuxtLink
          v-if="auth.isOperator"
          class="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
          to="/operator"
        >
          Operador
        </NuxtLink>

        <NuxtLink
          v-if="auth.isAdmin"
          class="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
          to="/admin"
        >
          Admin
        </NuxtLink>

        <NuxtLink
          v-if="auth.isAdmin"
          class="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
          to="/admin/users"
        >
          Usuarios
        </NuxtLink>

        <template v-if="auth.isAuthenticated">
          <span class="hidden text-slate-500 sm:inline">
            {{ auth.user?.name }} · {{ auth.role }}
          </span>
          <button
            class="focus-ring rounded bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-slate-700"
            type="button"
            @click="logout"
          >
            Salir
          </button>
        </template>

        <NuxtLink
          v-else
          class="focus-ring rounded bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700"
          to="/login"
        >
          Entrar
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const auth = useAuthStore()

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>
