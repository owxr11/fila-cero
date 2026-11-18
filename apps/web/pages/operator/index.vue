<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Operador
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Panel de operador
      </h1>
    </div>

    <p v-if="error" role="alert" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ error }}
    </p>

    <p v-if="pending" class="text-slate-600">
      Cargando servicios...
    </p>

    <p v-else-if="!services.length" class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      No hay servicios disponibles por el momento.
    </p>

    <div v-else class="space-y-4">
      <label class="block text-sm">
        <span class="font-medium text-slate-700">Servicio</span>
        <select
          v-model="selectedServiceId"
          class="focus-ring mt-1 w-full max-w-xs rounded border border-slate-300 bg-white px-3 py-2"
          @change="loadQueue"
        >
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.prefix }} · {{ service.name }}
          </option>
        </select>
      </label>

      <div class="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p class="text-sm text-slate-500">
            Turno actual
          </p>
          <p class="mt-1 font-mono text-5xl font-bold text-teal-700">
            {{ queue?.current?.code ?? '—' }}
          </p>
          <p v-if="queue?.current?.counterId" class="mt-2 text-xs text-slate-500">
            Módulo {{ queue.current.counterId }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white">
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 class="text-lg font-semibold text-slate-950">
              Lista de espera
            </h2>
            <span class="text-sm text-slate-500">{{ queue?.waiting.length ?? 0 }} en espera</span>
          </div>

          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-2 font-medium">Número</th>
                <th class="px-4 py-2 font-medium">Código</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!queue?.waiting.length">
                <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                  Nadie en espera.
                </td>
              </tr>
              <tr
                v-for="item in queue?.waiting"
                v-else
                :key="item.id"
                class="border-t border-slate-100"
              >
                <td class="px-4 py-2 text-slate-600">{{ item.number }}</td>
                <td class="px-4 py-2 font-mono font-semibold text-slate-900">{{ item.code }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-slate-400">
        Se refresca cada 5 segundos. Las acciones de llamar, iniciar y finalizar se agregan en R2.
      </p>
    </div>

  </section>
</template>

<script setup lang="ts">
import type { QueueView, Service } from '~/types/api'

definePageMeta({
  middleware: 'operator'
})

const { request } = useApi()

const REFRESH_MS = 5_000

const services = ref<Service[]>([])
const selectedServiceId = ref('')
const queue = ref<QueueView | null>(null)
const pending = ref(true)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

async function loadQueue() {
  if (!selectedServiceId.value) {
    return
  }

  try {
    queue.value = await request<QueueView>('/queue', { query: { serviceId: selectedServiceId.value } })
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo consultar la cola.'
  }
}

onMounted(async () => {
  try {
    services.value = await request<Service[]>('/services', {
      query: { active: 'true' }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar los servicios.'
    pending.value = false
    return
  }

  selectedServiceId.value = services.value[0]?.id ?? ''
  await loadQueue()
  pending.value = false
  timer = setInterval(loadQueue, REFRESH_MS)
})

onBeforeUnmount(() => {
  if (timer !== undefined) {
    clearInterval(timer)
  }
})
</script>
