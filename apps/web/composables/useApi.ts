import type { ApiEnvelope, ApiErrorBody } from '~/types/api'

interface ApiRequestOptions<TBody> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: TBody
  query?: Record<string, string | number | boolean | undefined>
  auth?: boolean
}

function buildQuery(
  query?: Record<string, string | number | boolean | undefined>
) {
  const params = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}


export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
    retried = false
  ): Promise<TResponse> {
    const headers = new Headers({
      Accept: 'application/json'
    })

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    if (options.auth && auth.accessToken) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`)
    }

    const response = await fetch(
      `${config.public.apiBaseUrl}${path}${buildQuery(options.query)}`,
      {
        method: options.method ?? 'GET',
        headers,
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body)
      }
    )

    // El accessToken dura 15 min: si expiró, se renueva una vez con el refreshToken y se reintenta
    if (response.status === 401 && options.auth && !retried && auth.refreshToken) {
      const renewed = await auth.refreshSession()
      if (renewed) {
        return request<TResponse, TBody>(path, options, true)
      }
    }

    if (response.status === 204) {
      return undefined as TResponse
    }

    const payload = await response.json().catch(() => null) as
      | ApiEnvelope<TResponse>
      | ApiErrorBody
      | null

    if (!response.ok) {
      const apiError =
        payload && 'error' in payload
          ? payload.error
          : undefined

      const message =
        apiError?.message ??
        'No se pudo completar la operación'

      throw new Error(message)
    }

    return (payload as ApiEnvelope<TResponse>).data
  }

  return { request }
}
