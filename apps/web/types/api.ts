// Tipos compartidos con la API (contrato: docs/contrato.md)

export type Role = 'VISITOR' | 'OPERATOR' | 'ADMIN'

export type TicketStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'CANCELLED'

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: {
    count?: number
    requestId?: string
  }
}

export interface ApiErrorBody {
  success?: false
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
  message?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface Service {
  id: string
  orgId: string
  name: string
  prefix: string
  active: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ServicePayload {
  name: string
  prefix: string
  active: boolean
}

export interface Counter {
  id: string
  orgId: string
  name: string
  serviceIds: string[]
  active: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CounterPayload {
  name: string
  serviceIds: string[]
  active: boolean
}

export interface Ticket {
  id: string
  orgId: string
  serviceId: string
  serviceName: string
  number: number
  code: string
  dayKey: string
  status: TicketStatus
  counterId?: string | null
  createdAt?: string | null
  calledAt?: string | null
  startedAt?: string | null
  finishedAt?: string | null
}

export interface TicketStatusView {
  id: string
  code: string
  serviceName: string
  status: TicketStatus
  ahead: number
}

export interface QueueView {
  serviceId: string
  dayKey: string
  current: Pick<Ticket, 'id' | 'code' | 'counterId'> | null
  waiting: Pick<Ticket, 'id' | 'code' | 'number'>[]
}
