import { defineStore } from 'pinia'
import type { Role, User, UserPayload, UserUpdate } from '~/types/api'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchUsers(role: Role | '' = '') {
    const api = useApi()
    loading.value = true
    error.value = ''

    try {
      users.value = await api.request<User[]>('/users', {
        query: { role },
        auth: true
      })
    } catch (unknownError) {
      error.value = (unknownError as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createUser(payload: UserPayload) {
    const api = useApi()
    return api.request<User, UserPayload>('/users', {
      method: 'POST',
      body: payload,
      auth: true
    })
  }

  async function updateUser(id: string, payload: UserUpdate) {
    const api = useApi()
    const updated = await api.request<User, UserUpdate>(`/users/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true
    })

    users.value = users.value.map((user) => (user.id === id ? updated : user))
    return updated
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser
  }
})
