<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-semibold text-teal-700">
          Tablero público
        </p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
          Turnos y atención en sala
        </h1>
      </div>
      <div v-if="lastUpdated" class="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
        <span class="relative flex size-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
        </span>
        <span>En vivo · {{ lastUpdated }}</span>
      </div>
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

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="service in services"
        :key="service.id"
        class="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
      >
        <!-- Encabezado del servicio -->
        <header class="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/75 px-5 py-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              {{ service.name }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ queueOf(service.id)?.waiting.length ?? 0 }} en espera
            </p>
          </div>
          <span class="grid size-10 place-items-center rounded-xl bg-teal-800 font-mono text-lg font-black text-white shadow-sm">
            {{ service.prefix }}
          </span>
        </header>

        <!-- Turno actual en atención -->
        <div class="px-5 py-6 text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Turno actual
          </p>
          <p class="mt-2 font-mono text-6xl font-black tracking-tight text-teal-700">
            {{ queueOf(service.id)?.current?.code ?? '—' }}
          </p>
          <p
            v-if="queueOf(service.id)?.current"
            class="mt-2 inline-block rounded-md bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-900"
          >
            {{ queueOf(service.id)?.current?.counterName || (queueOf(service.id)?.current?.counterId ? `Módulo ${queueOf(service.id)?.current?.counterId}` : 'En atención') }}
          </p>
          <p v-else class="mt-2 text-xs text-slate-400">
            Sin llamadas activas
          </p>
        </div>

        <!-- Siguientes turnos en espera -->
        <div class="border-t border-slate-100 bg-slate-50/50 p-5">
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-600">
              Siguientes en fila
            </p>
            <span
              v-if="queueOf(service.id)?.waiting.length"
              class="text-xs font-medium text-slate-500"
            >
              ≈ {{ queueOf(service.id)?.estimatedMinutes ?? 0 }} min espera
            </span>
          </div>

          <div v-if="!queueOf(service.id)?.waiting.length" class="mt-3 text-sm text-slate-400">
            Nadie en espera actualmente.
          </div>

          <div v-else class="mt-3 space-y-3">
            <!-- Primer siguiente turno destacado -->
            <div class="flex items-center justify-between rounded-lg bg-teal-50/80 px-3 py-2 border border-teal-100">
              <span class="text-xs font-semibold text-teal-900">Siguiente a pasar:</span>
              <span class="font-mono text-base font-black text-teal-800">
                {{ queueOf(service.id)?.waiting[0]?.code }}
              </span>
            </div>

            <!-- Resto de los que siguen -->
            <div v-if="(queueOf(service.id)?.waiting.length ?? 0) > 1">
              <p class="mb-1 text-xs text-slate-400">Próximos turnos:</p>
              <ul class="flex flex-wrap gap-1.5">
                <li
                  v-for="item in queueOf(service.id)?.waiting.slice(1, 7)"
                  :key="item.id"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700"
                >
                  {{ item.code }}
                </li>
                <li
                  v-if="(queueOf(service.id)?.waiting.length ?? 0) > 7"
                  class="grid place-items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                >
                  +{{ (queueOf(service.id)?.waiting.length ?? 0) - 7 }} más
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    </div>

    <footer class="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
      <p>Actualización automática cada 5 segundos</p>
      <p v-if="lastUpdated">Último refresco: {{ lastUpdated }}</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import type { QueueView, Service } from '~/types/api'

const { request } = useApi()

// Se refresca solo cada 5 segundos
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
