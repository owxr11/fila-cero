import { defineStore } from 'pinia'
import type { HistoryFilters, HistorySummary, HistoryTicket } from '~/types/api'

export const useHistoryStore = defineStore('history', () => {
  const items = ref<HistoryTicket[]>([])
  const summary = ref<HistorySummary | null>(null)
  const loading = ref(false)
  const error = ref('')

  function toQuery(filters: HistoryFilters) {
    return {
      date: filters.date || undefined,
      serviceId: filters.serviceId || undefined,
      counterId: filters.counterId || undefined,
      status: filters.status || undefined
    }
  }

  async function fetchHistory(filters: HistoryFilters) {
    const api = useApi()
    const query = toQuery(filters)
    loading.value = true
    error.value = ''

    try {
      const [list, totals] = await Promise.all([
        api.request<HistoryTicket[]>('/history', { query, auth: true }),
        api.request<HistorySummary>('/history/summary', { query, auth: true })
      ])

      items.value = list
      summary.value = totals
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo cargar el historial'
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    summary,
    loading,
    error,
    fetchHistory
  }
})
