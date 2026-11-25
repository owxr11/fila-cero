<template>
  <section class="space-y-8">
    <div>
      <p class="font-semibold text-teal-700">
        Administración
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Usuarios
      </h1>
      <p class="mt-2 text-slate-600">
        Da de alta operadores y administradores, cambia su rol o desactiva su cuenta.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div class="min-w-0 rounded-lg border border-slate-200 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h2 class="text-lg font-semibold text-slate-950">
            Cuentas
          </h2>
          <label class="flex items-center gap-2 text-sm text-slate-600">
            Rol
            <select
              v-model="roleFilter"
              class="focus-ring rounded border border-slate-300 px-2 py-1"
              :disabled="store.loading"
              @change="store.fetchUsers(roleFilter)"
            >
              <option value="">Todos</option>
              <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
            </select>
          </label>
        </div>

        <p
          v-if="store.error || actionError"
          class="m-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {{ store.error || actionError }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-2 font-medium">Usuario</th>
                <th class="px-4 py-2 font-medium">Rol</th>
                <th class="px-4 py-2 font-medium">Estado</th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.loading">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">Cargando usuarios…</td>
              </tr>
              <tr v-else-if="store.users.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">No hay usuarios.</td>
              </tr>
              <tr
                v-for="user in store.users"
                v-else
                :key="user.id"
                class="border-t border-slate-100"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-900">
                    {{ user.name }}
                    <span v-if="isSelf(user)" class="text-xs text-slate-500">(tú)</span>
                  </p>
                  <p class="text-slate-500">{{ user.email }}</p>
                </td>
                <td class="px-4 py-2">
                  <select
                    class="focus-ring rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100 disabled:text-slate-500"
                    :aria-label="`Rol de ${user.name}`"
                    :value="user.role"
                    :disabled="isSelf(user) || savingId !== ''"
                    @change="changeRole(user, $event)"
                  >
                    <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
                  </select>
                </td>
                <td class="px-4 py-2">
                  <span :class="badgeClass(user.active)">{{ user.active ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-right">
                  <button
                    class="focus-ring rounded px-3 py-1 font-medium text-teal-700 hover:bg-teal-50 disabled:text-slate-400"
                    type="button"
                    :disabled="savingId !== ''"
                    @click="editName(user)"
                  >
                    Renombrar
                  </button>
                  <button
                    class="focus-ring rounded px-3 py-1 font-medium text-teal-700 hover:bg-teal-50 disabled:text-slate-400"
                    type="button"
                    :disabled="isSelf(user) || savingId !== ''"
                    @click="save(user, { active: !user.active })"
                  >
                    {{ user.active ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form class="space-y-4 self-start rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submit">
        <h2 class="text-lg font-semibold text-slate-950">
          Nuevo usuario
        </h2>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Nombre</span>
          <input
            v-model="form.name"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            minlength="2"
            maxlength="120"
            autocomplete="off"
            required
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Correo</span>
          <input
            v-model="form.email"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="email"
            autocomplete="off"
            required
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Contraseña</span>
          <input
            v-model="form.password"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            minlength="8"
            maxlength="100"
            autocomplete="new-password"
            required
          >
          <span class="mt-1 block text-xs text-slate-500">Mínimo 8 caracteres.</span>
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Rol</span>
          <select v-model="form.role" class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>

        <p v-if="formError" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ formError }}
        </p>
        <p v-if="formSuccess" class="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800" role="status">
          {{ formSuccess }}
        </p>

        <button
          class="focus-ring rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
          type="submit"
          :disabled="creating"
        >
          {{ creating ? 'Guardando…' : 'Crear usuario' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Role, User, UserPayload, UserUpdate } from '~/types/api'

definePageMeta({
  middleware: 'admin'
})

const auth = useAuthStore()
const store = useUsersStore()

const roles: { value: Role, label: string }[] = [
  { value: 'VISITOR', label: 'Visitante' },
  { value: 'OPERATOR', label: 'Operador' },
  { value: 'ADMIN', label: 'Administrador' }
]

const roleFilter = ref<Role | ''>('')
const savingId = ref('')
const actionError = ref('')
const creating = ref(false)
const formError = ref('')
const formSuccess = ref('')

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  role: 'OPERATOR'
})

function isSelf(user: User) {
  return user.id === auth.user?.id
}

function badgeClass(active: boolean) {
  return active
    ? 'rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800'
    : 'rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
}

async function save(user: User, payload: UserUpdate) {
  savingId.value = user.id
  actionError.value = ''

  try {
    await store.updateUser(user.id, payload)

    if (isSelf(user)) {
      await auth.loadMe()
    }
  } catch (error) {
    actionError.value = (error as Error).message
  } finally {
    savingId.value = ''
  }
}

async function changeRole(user: User, event: Event) {
  const select = event.target as HTMLSelectElement
  await save(user, { role: select.value as Role })

  // Si la API rechazó el cambio, se vuelve a mostrar el rol guardado
  select.value = store.users.find((item) => item.id === user.id)?.role ?? user.role
}

async function editName(user: User) {
  const name = window.prompt('Nuevo nombre', user.name)?.trim()

  if (name && name !== user.name) {
    await save(user, { name })
  }
}

async function submit() {
  creating.value = true
  formError.value = ''
  formSuccess.value = ''

  try {
    const created = await store.createUser({ ...form })
    Object.assign(form, { name: '', email: '', password: '', role: 'OPERATOR' })
    formSuccess.value = `Usuario ${created.name} creado.`
    await store.fetchUsers(roleFilter.value)
  } catch (error) {
    formError.value = (error as Error).message
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  auth.restoreSession()
  store.fetchUsers()
})
</script>
