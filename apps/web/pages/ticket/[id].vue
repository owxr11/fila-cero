<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Mi turno
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Estado de tu turno
      </h1>
    </div>

    <p v-if="error" role="alert" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ error }}
    </p>

    <p v-if="pending" class="text-slate-600">
      Cargando tu turno...
    </p>

    <div v-else-if="ticket" class="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p class="text-sm font-medium text-slate-500">
        {{ ticket.serviceName || 'Servicio' }}
      </p>

      <p class="mt-2 font-mono text-7xl font-bold tracking-tight text-slate-950">
        {{ ticket.code }}
      </p>

      <p class="mt-4">
        <span :class="statusClass(ticket.status)">
          {{ statusLabel[ticket.status] }}
        </span>
      </p>

      <!-- Turno en espera (WAITING) -->
      <div v-if="ticket.status === 'WAITING'" class="mt-6 border-t border-slate-100 pt-4">
        <p class="text-sm text-slate-500">
          Personas delante de ti
        </p>
        <p class="mt-1 text-6xl font-bold text-teal-700">
          {{ ticket.ahead }}
        </p>
        <p v-if="ticket.ahead === 0" class="mt-2 text-sm font-semibold text-teal-800">
          Eres el siguiente
        </p>

        <!-- Tiempo de espera estimado aproximado -->
        <div class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tiempo estimado de espera
          </p>
          <p class="mt-1 text-2xl font-bold text-slate-900">
            ≈ {{ ticket.estimatedMinutes ?? 0 }} min <span class="text-sm font-normal text-slate-500">(aproximado)</span>
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ ticket.isDefault ? 'Estimación estándar (5 min/persona)' : `Basado en los últimos ${ticket.ticketsSampled} turnos atendidos` }}
          </p>
        </div>
      </div>

      <!-- Aviso grande cuando lo llaman (CALLED) -->
      <div
        v-else-if="ticket.status === 'CALLED'"
        class="mt-6 rounded-2xl border-2 border-teal-500 bg-teal-50 p-6 text-center shadow-md animate-pulse"
      >
        <div class="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-teal-600 text-white shadow">
          <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p class="text-3xl font-extrabold tracking-tight text-teal-950">
          ¡Es tu turno!
        </p>
        <p class="mt-2 text-xl font-bold text-teal-800">
          Pasa al {{ moduleDestinationText }}
        </p>
      </div>

      <!-- Turno en atención (IN_SERVICE) -->
      <div
        v-else-if="ticket.status === 'IN_SERVICE'"
        class="mt-6 rounded-xl border border-sky-300 bg-sky-50 p-5 text-center"
      >
        <p class="text-xl font-bold text-sky-950">
          En atención
        </p>
        <p class="mt-1 text-base font-medium text-sky-800">
          Atendiéndote en {{ moduleDestinationText }}
        </p>
      </div>

      <p class="mt-6 text-xs text-slate-400">
        Se actualiza cada 5 segundos
      </p>
    </div>

    <p class="mt-4 font-mono text-sm text-slate-500">
      Ticket: {{ ticketId }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { TicketStatus, TicketStatusView } from '~/types/api'

const route = useRoute()
const ticketId = computed(() => String(route.params.id))

const { request } = useApi()

// Actualización cada 5 segundos para el visitante
const REFRESH_MS = 5_000

const ticket = ref<TicketStatusView | null>(null)
const pending = ref(true)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const statusLabel: Record<TicketStatus, string> = {
  WAITING: 'En espera',
  CALLED: 'Te están llamando',
  IN_SERVICE: 'En atención',
  DONE: 'Finalizado',
  CANCELLED: 'Cancelado'
}

const statusClasses: Record<TicketStatus, string> = {
  WAITING: 'bg-amber-100 text-amber-800',
  CALLED: 'bg-teal-100 text-teal-800',
  IN_SERVICE: 'bg-sky-100 text-sky-800',
  DONE: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-800'
}

const moduleDestinationText = computed(() => {
  const name = ticket.value?.counterName
  const id = ticket.value?.counterId
  if (name) {
    return name.startsWith('Módulo') ? name : `Módulo ${name}`
  }
  if (id) {
    return id.startsWith('Módulo') ? id : `Módulo ${id}`
  }
  return 'Módulo 2'
})

function statusClass(status: TicketStatus) {
  return `rounded-full px-4 py-1 text-sm font-semibold ${statusClasses[status]}`
}

async function loadTicket() {
  try {
    ticket.value = await request<TicketStatusView>(`/queue/tickets/${ticketId.value}`)
    error.value = ''

    // Un turno terminado ya no cambia: se deja de refrescar
    if (ticket.value.status === 'DONE' || ticket.value.status === 'CANCELLED') {
      stopRefresh()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo consultar tu turno.'
  } finally {
    pending.value = false
  }
}

function stopRefresh() {
  if (timer !== undefined) {
    clearInterval(timer)
    timer = undefined
  }
}

onMounted(async () => {
  await loadTicket()
  timer = setInterval(loadTicket, REFRESH_MS)
})

onBeforeUnmount(stopRefresh)
</script>
