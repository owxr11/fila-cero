<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Tablero
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Turnos en espera
      </h1>
    </div>

    <p v-if="error" role="alert" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ error }}
    </p>
    
    <p v-if="pending" class="text-slate-600">
      Cargando tablero...
    </p>

    <p v-else-if="!services.length" class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      No hay servicios disponibles por el momento.
    </p>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="service in services"
        :key="service.id"
        class="rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <header class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 class="text-lg font-semibold text-slate-950">
            {{ service.name }}
          </h2>
          <span class="grid size-8 place-items-center rounded bg-slate-900 font-bold text-white">
            {{ service.prefix }}
          </span>
        </header>

        <div class="px-4 py-5 text-center">
          <p class="text-sm text-slate-500">
            Turno actual
          </p>
          <p class="mt-1 font-mono text-6xl font-bold text-teal-700">
            {{ queueOf(service.id)?.current?.code ?? '—' }}
          </p>
        </div>

        <div class="border-t border-slate-100 px-4 py-3">
          <p class="text-sm font-medium text-slate-700">
            En espera ({{ queueOf(service.id)?.waiting.length ?? 0 }})
          </p>

          <p v-if="!queueOf(service.id)?.waiting.length" class="mt-2 text-sm text-slate-500">
            Nadie en espera.
          </p>

          <ul v-else class="mt-2 flex flex-wrap gap-2">
            <li
              v-for="item in queueOf(service.id)?.waiting"
              :key="item.id"
              class="rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800"
            >
              {{ item.code }}
            </li>
          </ul>
        </div>
      </article>
    </div>

    <p v-if="lastUpdated" class="text-xs text-slate-400">
      Actualizado a las {{ lastUpdated }} · se refresca cada 5 segundos
    </p>
  </section>
</template>

<script setup lang="ts">
import type { QueueView, Service } from '~/types/api'

const { request } = useApi()

const REFRESH_MS = 5_000

const services = ref<Service[]>([])
const queues = ref<Record<string, QueueView>>({})
const pending = ref(true)
const error = ref('')
const lastUpdated = ref('')
let timer: ReturnType<typeof setInterval> | undefined

function queueOf(serviceId: string): QueueView | undefined {
  return queues.value[serviceId]
}

async function loadQueues() {
  try {
    const entries = await Promise.all(
      services.value.map(async (service) => {
        const queue = await request<QueueView>('/queue', { query: { serviceId: service.id } })
        return [service.id, queue] as const
      })
    )

    queues.value = Object.fromEntries(entries)
    lastUpdated.value = new Date().toLocaleTimeString('es-MX')
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo actualizar el tablero.'
  }
}

onMounted(async () => {
  try {
    // Solo servicios activos
    services.value = await request<Service[]>('/services', {
      query: { active: 'true' }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar los servicios.'
    pending.value = false
    return
  }

  await loadQueues()
  pending.value = false
  timer = setInterval(loadQueues, REFRESH_MS)
})

onBeforeUnmount(() => {
  if (timer !== undefined) {
    clearInterval(timer)
  }
})
</script>
