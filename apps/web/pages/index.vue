<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Visitante
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Sacar turno
      </h1>
      <p class="mt-1 text-slate-600">
        Elige el servicio que necesitas y toma tu turno.
      </p>
    </div>

    <p
      v-if="error"
      role="alert"
      class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {{ error }}
    </p>

    <p
      v-if="existing"
      role="alert"
      class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      Ya tienes el turno <strong>{{ existing.code }}</strong>.
      <NuxtLink
        :to="`/ticket/${existing.ticketId}`"
        class="font-semibold underline"
      >
        Ver mi turno
      </NuxtLink>
    </p>

    <p v-if="pending" class="text-slate-600">
      Cargando servicios...
    </p>

    <p
      v-else-if="!services.length"
      class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      No hay servicios disponibles por el momento.
    </p>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="service in services"
        :key="service.id"
        class="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-4 py-3 shadow-sm"
      >
        <div>
          <p class="font-semibold text-slate-950">
            {{ service.name }}
          </p>
          <p class="text-sm text-slate-500">
            Prefijo {{ service.prefix }}
          </p>
        </div>

        <button
          type="button"
          class="rounded bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingId !== null"
          @click="takeTicket(service.id)"
        >
          {{ loadingId === service.id ? 'Generando...' : 'Tomar turno' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { Service } from '~/types/api'
import { ApiError } from '~/composables/useApi'

const { request } = useApi()
const ticketsStore = useTicketsStore()

const services = ref<Service[]>([])
const pending = ref(true)
const error = ref('')
const existing = ref<{ ticketId: string; code: string } | null>(null)
const loadingId = ref<string | null>(null)

onMounted(async () => {
  try {
    // Solo servicios activos
    services.value = await request<Service[]>('/services', {
      query: { active: 'true' }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar los servicios.'
  } finally {
    pending.value = false
  }
})

async function takeTicket(serviceId: string) {
  if (loadingId.value !== null) return

  error.value = ''
  existing.value = null
  loadingId.value = serviceId

  try {
    const ticket = await ticketsStore.issueTicket(serviceId)
    await navigateTo(`/ticket/${ticket.id}`)
  } catch (e) {
    if (e instanceof ApiError && e.code === 'ACTIVE_TICKET_EXISTS') {
      existing.value = e.details as { ticketId: string; code: string }
    } else {
      error.value = e instanceof Error ? e.message : 'No se pudo emitir el turno.'
    }
  } finally {
    loadingId.value = null
  }
}
</script>
