import { defineStore } from 'pinia'
import type { Ticket } from '~/types/api'

const STORAGE_KEY = 'filacero:clientId'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const useTicketsStore = defineStore('tickets', () => {
  function getClientId(): string {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  }
  function issueTicket(serviceId: string) {
    const { request } = useApi()
    return request<Ticket, { serviceId: string; clientId: string }>('/tickets', {
      method: 'POST',
      body: { serviceId, clientId: getClientId() }
    })
  }

  return { getClientId, issueTicket }
})
