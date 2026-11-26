<template>
  <section class="space-y-8">
    <div>
      <p class="font-semibold text-teal-700">
        Administración
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Establecimiento
      </h1>
      <p class="mt-2 text-slate-600">
        Estos datos los ven los visitantes en la página principal.
      </p>
    </div>

    <p
      v-if="store.error"
      class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {{ store.error }}
    </p>

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submit">
        <p v-if="store.loading && !store.organization" class="text-slate-500">
          Cargando establecimiento…
        </p>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Nombre</span>
          <input
            v-model="form.name"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            minlength="2"
            maxlength="80"
            required
            placeholder="FilaCero Centro"
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Dirección</span>
          <input
            v-model="form.address"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            maxlength="160"
            placeholder="Av. Siempre Viva 123, Ciudad de México"
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Horario</span>
          <input
            v-model="form.schedule"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            maxlength="120"
            placeholder="Lunes a viernes de 9:00 a 17:00"
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Mensaje para los visitantes</span>
          <textarea
            v-model="form.message"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            rows="3"
            maxlength="280"
            placeholder="Toma tu turno y espera a que te llamen en el tablero."
          />
          <span class="mt-1 block text-right text-xs text-slate-500">{{ form.message.length }}/280</span>
        </label>

        <p v-if="formError" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ formError }}
        </p>
        <p v-if="success" class="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {{ success }}
        </p>

        <div class="flex gap-2">
          <button
            class="focus-ring rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
            type="submit"
            :disabled="saving || !store.organization || !changed"
          >
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
          <button
            v-if="changed"
            class="focus-ring rounded px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            type="button"
            @click="resetForm"
          >
            Descartar
          </button>
        </div>
      </form>

      <div class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vista previa
        </h2>
        <div class="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
          <p class="text-lg font-bold text-teal-900">
            {{ form.name || 'Nombre del establecimiento' }}
          </p>
          <p v-if="form.message" class="mt-1 text-teal-800">
            {{ form.message }}
          </p>
          <p
            v-if="form.schedule || form.address"
            class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-teal-700"
          >
            <span v-if="form.schedule">Horario: {{ form.schedule }}</span>
            <span v-if="form.address">{{ form.address }}</span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { OrganizationPayload } from '~/types/api'

definePageMeta({
  middleware: 'admin'
})

const store = useOrganizationStore()

const form = reactive({
  name: '',
  address: '',
  schedule: '',
  message: ''
})

const saving = ref(false)
const formError = ref('')
const success = ref('')

const fields = ['name', 'address', 'schedule', 'message'] as const

const changes = computed<OrganizationPayload>(() => {
  const current = store.organization
  if (!current) {
    return {}
  }

  return Object.fromEntries(
    fields
      .filter((field) => form[field].trim() !== (current[field] ?? ''))
      .map((field) => [field, form[field].trim()])
  )
})

const changed = computed(() => Object.keys(changes.value).length > 0)

function resetForm() {
  const current = store.organization
  for (const field of fields) {
    form[field] = current?.[field] ?? ''
  }
  formError.value = ''
}

async function submit() {
  saving.value = true
  formError.value = ''
  success.value = ''

  try {
    await store.updateOrganization(changes.value)
    resetForm()
    success.value = 'Datos del establecimiento guardados.'
  } catch (unknownError) {
    formError.value = unknownError instanceof Error ? unknownError.message : 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await store.fetchOrganization()
  resetForm()
})
</script>
