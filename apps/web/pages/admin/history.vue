<template>
  <section class="space-y-8">
    <div>
      <p class="font-semibold text-teal-700">
        Operación
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Historial de atención
      </h1>
      <p class="mt-2 text-slate-600">
        Tickets del día con sus tiempos y el resumen por módulo.
      </p>
    </div>

    <form
      class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      @submit.prevent="load"
    >
      <label class="block text-sm">
        <span class="font-medium text-slate-700">Fecha</span>
        <input
          v-model="filters.date"
          class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
          type="date"
          required
        >
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Servicio</span>
        <select v-model="filters.serviceId" class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Todos</option>
          <option v-for="service in catalog.services" :key="service.id" :value="service.id">
            {{ service.prefix }} · {{ service.name }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Módulo</span>
        <select v-model="filters.counterId" class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Todos</option>
          <option v-for="counter in catalog.counters" :key="counter.id" :value="counter.id">
            {{ counter.name }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Estado</span>
        <select v-model="filters.status" class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Todos</option>
          <option v-for="(label, status) in statusLabels" :key="status" :value="status">
            {{ label }}
          </option>
        </select>
      </label>

      <div class="flex items-end gap-2">
        <button
          class="focus-ring rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
          type="submit"
          :disabled="history.loading"
        >
          {{ history.loading ? 'Buscando…' : 'Buscar' }}
        </button>
        <button
          class="focus-ring rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
          type="button"
          @click="clearFilters"
        >
          Limpiar
        </button>
      </div>
    </form>

    <p
      v-if="history.error"
      class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {{ history.error }}
    </p>

    <div v-if="history.summary" class="space-y-3">
      <h2 class="text-lg font-semibold text-slate-950">
        Resumen por módulo
      </h2>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-500">Atendidos</p>
          <p class="text-2xl font-bold text-slate-950">{{ history.summary.totals.attended }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-500">Cancelados</p>
          <p class="text-2xl font-bold text-slate-950">{{ history.summary.totals.cancelled }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-500">Atención promedio</p>
          <p class="text-2xl font-bold text-slate-950">{{ formatMinutes(history.summary.totals.averageAttentionMinutes) }}</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="px-4 py-2 font-medium">Módulo</th>
              <th class="px-4 py-2 text-right font-medium">Atendidos</th>
              <th class="px-4 py-2 text-right font-medium">Cancelados</th>
              <th class="px-4 py-2 text-right font-medium">Atención promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="history.summary.counters.length === 0">
              <td colspan="4" class="px-4 py-6 text-center text-slate-500">Sin tickets para estos filtros.</td>
            </tr>
            <tr
              v-for="counter in history.summary.counters"
              :key="counter.counterId ?? 'sin-modulo'"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-2 font-medium text-slate-900">{{ counter.counterName }}</td>
              <td class="px-4 py-2 text-right">{{ counter.attended }}</td>
              <td class="px-4 py-2 text-right">{{ counter.cancelled }}</td>
              <td class="px-4 py-2 text-right">{{ formatMinutes(counter.averageAttentionMinutes) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-950">
          Tickets
        </h2>
        <span class="text-sm text-slate-500">{{ history.items.length }} en total</span>
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="px-4 py-2 font-medium">Turno</th>
              <th class="px-4 py-2 font-medium">Servicio</th>
              <th class="px-4 py-2 font-medium">Módulo</th>
              <th class="px-4 py-2 font-medium">Estado</th>
              <th class="px-4 py-2 font-medium">Emitido</th>
              <th class="px-4 py-2 text-right font-medium">Espera</th>
              <th class="px-4 py-2 text-right font-medium">Atención</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="history.loading && history.items.length === 0">
              <td colspan="7" class="px-4 py-6 text-center text-slate-500">Cargando historial…</td>
            </tr>
            <tr v-else-if="history.items.length === 0">
              <td colspan="7" class="px-4 py-6 text-center text-slate-500">No hay tickets para estos filtros.</td>
            </tr>
            <tr
              v-for="ticket in history.items"
              :key="ticket.id"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-2 font-mono font-bold text-slate-900">{{ ticket.code }}</td>
              <td class="px-4 py-2">{{ ticket.serviceName ?? '—' }}</td>
              <td class="px-4 py-2">{{ ticket.counterName ?? '—' }}</td>
              <td class="px-4 py-2">
                <span :class="statusClass(ticket.status)">{{ statusLabels[ticket.status] }}</span>
              </td>
              <td class="px-4 py-2 text-slate-600">{{ formatTime(ticket.createdAt) }}</td>
              <td class="px-4 py-2 text-right">{{ formatMinutes(ticket.waitMinutes) }}</td>
              <td class="px-4 py-2 text-right">{{ formatMinutes(ticket.attentionMinutes) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HistoryFilters, TicketStatus } from '~/types/api'

definePageMeta({
  middleware: 'operator'
})

const history = useHistoryStore()
const catalog = useCatalogStore()

const statusLabels: Record<TicketStatus, string> = {
  WAITING: 'En espera',
  CALLED: 'Llamado',
  IN_SERVICE: 'En atención',
  DONE: 'Atendido',
  CANCELLED: 'Cancelado'
}

function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

const filters = reactive<Required<HistoryFilters>>({
  date: today(),
  serviceId: '',
  counterId: '',
  status: ''
})

function statusClass(status: TicketStatus) {
  const base = 'rounded px-2 py-0.5 text-xs font-medium'
  const colors: Record<TicketStatus, string> = {
    WAITING: 'bg-amber-100 text-amber-800',
    CALLED: 'bg-sky-100 text-sky-800',
    IN_SERVICE: 'bg-indigo-100 text-indigo-800',
    DONE: 'bg-teal-100 text-teal-800',
    CANCELLED: 'bg-slate-100 text-slate-500'
  }
  return `${base} ${colors[status]}`
}

function formatMinutes(minutes: number | null) {
  return minutes === null ? '—' : `${minutes} min`
}

function formatTime(value: string | null) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function load() {
  return history.fetchHistory({ ...filters })
}

function clearFilters() {
  Object.assign(filters, { date: today(), serviceId: '', counterId: '', status: '' })
  load()
}

onMounted(async () => {
  await Promise.all([
    catalog.fetchServices(),
    catalog.fetchCounters(),
    load()
  ])
})
</script>
