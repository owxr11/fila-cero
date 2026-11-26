import { defineStore } from 'pinia'
import type { Organization, OrganizationPayload } from '~/types/api'

export const ORGANIZATION_ID = 'demo'

export const useOrganizationStore = defineStore('organization', () => {
  const organization = ref<Organization | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchOrganization() {
    const api = useApi()
    loading.value = true
    error.value = ''

    try {
      organization.value = await api.request<Organization>(`/organizations/${ORGANIZATION_ID}`)
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo cargar el establecimiento'
    } finally {
      loading.value = false
    }
  }

  async function updateOrganization(payload: OrganizationPayload) {
    const api = useApi()
    organization.value = await api.request<Organization, OrganizationPayload>(`/organizations/${ORGANIZATION_ID}`, {
      method: 'PATCH',
      body: payload,
      auth: true
    })

    return organization.value
  }

  return {
    organization,
    loading,
    error,
    fetchOrganization,
    updateOrganization
  }
})
