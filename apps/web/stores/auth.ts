import { defineStore } from 'pinia'
import type { AuthResponse, Role, User } from '~/types/api'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload extends LoginPayload {
  name: string
}

interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface RefreshResponse extends TokenPair {
  user?: User
}

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

  // Página de inicio según el rol
  const homePath = computed(() => {
    if (role.value === 'ADMIN') {
      return '/admin'
    }
    if (role.value === 'OPERATOR') {
      return '/operator'
    }
    return '/'
  })

  function restoreSession() {
    if (!import.meta.client) {
      return
    }

    accessToken.value = localStorage.getItem('accessToken') ?? ''
    refreshToken.value = localStorage.getItem('refreshToken') ?? ''

    const storedUser = localStorage.getItem('user')
    user.value = storedUser ? JSON.parse(storedUser) as User : null
  }

  function saveTokens(tokens: TokenPair) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken

    if (import.meta.client) {
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
    }
  }

  function saveUser(data: User) {
    user.value = data

    if (import.meta.client) {
      localStorage.setItem('user', JSON.stringify(data))
    }
  }

  function persistSession(data: AuthResponse) {
    saveUser(data.user)
    saveTokens(data)
  }

  function clearSession() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''

    if (import.meta.client) {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  function errorMessage(unknownError: unknown, fallback: string) {
    return unknownError instanceof Error ? unknownError.message : fallback
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = ''

    try {
      const api = useApi()
      const data = await api.request<AuthResponse, LoginPayload>('/auth/login', {
        method: 'POST',
        body: payload
      })

      persistSession(data)
    } catch (unknownError) {
      error.value = errorMessage(unknownError, 'No se pudo iniciar sesión')
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    error.value = ''

    try {
      const api = useApi()
      const data = await api.request<AuthResponse, RegisterPayload>('/auth/register', {
        method: 'POST',
        body: payload
      })

      persistSession(data)
    } catch (unknownError) {
      error.value = errorMessage(unknownError, 'No se pudo crear la cuenta')
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function loadMe() {
    if (!accessToken.value) {
      return
    }

    const api = useApi()
    saveUser(await api.request<User>('/auth/me', { auth: true }))
  }

  // Devuelve true si se pudo renovar la sesión
  async function refreshSession() {
    if (!refreshToken.value) {
      return false
    }

    try {
      const api = useApi()
      const tokens = await api.request<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })

      saveTokens(tokens)

      if (tokens.user) {
        saveUser(tokens.user)
      }
      return true
    } catch {
      clearSession()
      return false
    }
  }

  async function logout() {
    const token = refreshToken.value
    clearSession()

    if (token) {
      const api = useApi()
      await api.request('/auth/logout', {
        method: 'POST',
        body: { refreshToken: token }
      }).catch(() => undefined)
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
    homePath,
    restoreSession,
    persistSession,
    clearSession,
    login,
    register,
    loadMe,
    refreshSession,
    logout
  }
})
