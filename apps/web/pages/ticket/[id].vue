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

    <p v-if="error" role="alert"class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ error }}
    </p>

     <p v-if="pending" class="text-slate-600">
      Cargando tu turno...
    </p>

    <div v-else-if="ticket" class="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm" >
      <p class="text-sm font-medium text-slate-500">
        {{ ticket.serviceName }}
      </p>

      <p class="mt-2 font-mono text-7xl font-bold tracking-tight text-slate-950">
        {{ ticket.code }}
      </p>

      <p class="mt-4">
        <span :class="statusClass(ticket.status)">
          {{ statusLabel[ticket.status] }}
        </span>
      </p>

      <div v-if="ticket.status === 'WAITING'" class="mt-6 border-t border-slate-100 pt-4">
        <p class="text-sm text-slate-500">
          Personas delante de ti
        </p>
        <p class="mt-1 text-6xl font-bold text-teal-700">
          {{ ticket.ahead }}
        </p>
        <p v-if="ticket.ahead === 0" class="mt-2 text-sm font-medium text-teal-800">
          Eres el siguiente
        </p>
      </div>

      <p v-else-if="ticket.status === 'CALLED'" class="mt-6 border-t border-slate-100 pt-4 text-lg font-semibold text-teal-800">
        ¡Es tu turno! Pasa a tu módulo.
      </p>

      <p class="mt-6 text-xs text-slate-400">
        Se actualiza cada 10 segundos
      </p>
    </div>

  </section>
</template>

<script setup lang="ts">
import type { TicketStatus, TicketStatusView } from '~/types/api'

const route = useRoute()
const ticketId = computed(() => String(route.params.id))

const { request } = useApi()

const REFRESH_MS = 10_000

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
