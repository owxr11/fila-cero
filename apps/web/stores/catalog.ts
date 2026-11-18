import { defineStore } from 'pinia'
import type { Counter, CounterPayload, Service, ServicePayload } from '~/types/api'

export const useCatalogStore = defineStore('catalog', () => {
  const services = ref<Service[]>([])
  const counters = ref<Counter[]>([])
  const loadingServices = ref(false)
  const loadingCounters = ref(false)
  const servicesError = ref('')
  const countersError = ref('')

  const activeServices = computed(() => services.value.filter((service) => service.active))

  function serviceName(id: string) {
    const service = services.value.find((item) => item.id === id)
    return service ? `${service.prefix} · ${service.name}` : 'Servicio eliminado'
  }

  async function fetchServices() {
    const api = useApi()
    loadingServices.value = true
    servicesError.value = ''

    try {
      services.value = await api.request<Service[]>('/services')
    } catch (error) {
      servicesError.value = (error as Error).message
    } finally {
      loadingServices.value = false
    }
  }

  async function fetchCounters() {
    const api = useApi()
    loadingCounters.value = true
    countersError.value = ''

    try {
      counters.value = await api.request<Counter[]>('/counters', { auth: true })
    } catch (error) {
      countersError.value = (error as Error).message
    } finally {
      loadingCounters.value = false
    }
  }

  async function createService(payload: ServicePayload) {
    const api = useApi()
    const created = await api.request<Service, ServicePayload>('/services', {
      method: 'POST',
      body: payload,
      auth: true
    })

    services.value = [...services.value, created].sort((a, b) => a.prefix.localeCompare(b.prefix))
    return created
  }

  async function updateService(id: string, payload: Partial<ServicePayload>) {
    const api = useApi()
    const updated = await api.request<Service, Partial<ServicePayload>>(`/services/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true
    })

    services.value = services.value
      .map((service) => (service.id === id ? updated : service))
      .sort((a, b) => a.prefix.localeCompare(b.prefix))
    return updated
  }

  async function createCounter(payload: CounterPayload) {
    const api = useApi()
    const created = await api.request<Counter, CounterPayload>('/counters', {
      method: 'POST',
      body: payload,
      auth: true
    })

    counters.value = [...counters.value, created]
    return created
  }

  async function updateCounter(id: string, payload: Partial<CounterPayload>) {
    const api = useApi()
    const updated = await api.request<Counter, Partial<CounterPayload>>(`/counters/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true
    })

    counters.value = counters.value.map((counter) => (counter.id === id ? updated : counter))
    return updated
  }

  return {
    services,
    counters,
    loadingServices,
    loadingCounters,
    servicesError,
    countersError,
    activeServices,
    serviceName,
    fetchServices,
    fetchCounters,
    createService,
    updateService,
    createCounter,
    updateCounter
  }
})
