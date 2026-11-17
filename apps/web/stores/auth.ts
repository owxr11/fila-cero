import { defineStore } from 'pinia'
import type { AuthResponse, Role, User } from '~/types/api'


export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const role = computed<Role | null>(() => user.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const isOperator = computed(() => role.value === 'OPERATOR' || role.value === 'ADMIN')

  function restoreSession() {
    if (!import.meta.client) {
      return
    }

    accessToken.value = localStorage.getItem('accessToken') ?? ''
    refreshToken.value = localStorage.getItem('refreshToken') ?? ''

    const storedUser = localStorage.getItem('user')
    user.value = storedUser ? JSON.parse(storedUser) as User : null
  }

  function persistSession(data: AuthResponse) {
    user.value = data.user
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken

    if (import.meta.client) {
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
    }
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''

    if (import.meta.client) {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    role,
    isAdmin,
    isOperator,
    restoreSession,
    persistSession,
    logout
  }
})
