import { findAll as findCounters } from '../counters/counter.repository.js'
import { findAll as findServices } from '../services/service.repository.js'
import { DEFAULT_ORG_ID } from '../services/service.service.js'
import { buildDayKey } from '../tickets/tickets.utils.js'
import * as repository from './history.repository.js'
import { attentionMinutes, buildSummary, minutesBetween } from './history.utils.js'

async function loadCatalogNames() {
    const [services, counters] = await Promise.all([
        findServices({ orgId: DEFAULT_ORG_ID }),
        findCounters({ orgId: DEFAULT_ORG_ID })
    ])

    return {
        serviceNames: Object.fromEntries(services.map((service) => [service.id, service.name])),
        counterNames: Object.fromEntries(counters.map((counter) => [counter.id, counter.name]))
    }
}

function withDefaultDate(filters) {
    return { ...filters, date: filters.date ?? buildDayKey() }
}

export async function listHistory(rawFilters = {}) {
    const filters = withDefaultDate(rawFilters)
    const [tickets, { serviceNames, counterNames }] = await Promise.all([
        repository.findTickets(filters),
        loadCatalogNames()
    ])

    const items = tickets
        .map((ticket) => ({
            ...ticket,
            serviceName: ticket.serviceName ?? serviceNames[ticket.serviceId] ?? null,
            counterName: ticket.counterId ? counterNames[ticket.counterId] ?? null : null,
            waitMinutes: minutesBetween(ticket.createdAt, ticket.calledAt),
            attentionMinutes: attentionMinutes(ticket)
        }))
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.number - b.number)

    return { filters, items }
}

export async function getSummary(rawFilters = {}) {
    const filters = withDefaultDate(rawFilters)
    const [tickets, { counterNames }] = await Promise.all([
        repository.findTickets(filters),
        loadCatalogNames()
    ])

    const counterIds = filters.counterId ? [filters.counterId] : Object.keys(counterNames)

    return {
        filters,
        ...buildSummary(tickets, counterNames, counterIds)
    }
}
