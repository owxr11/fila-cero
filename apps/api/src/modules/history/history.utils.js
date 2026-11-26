export const NO_COUNTER_ID = 'SIN_MODULO'

export function toMillis(value) {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value.toMillis === 'function') {
        return value.toMillis()
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.getTime()
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const millis = new Date(value).getTime()
        return Number.isNaN(millis) ? null : millis
    }

    return null
}

export function minutesBetween(from, to) {
    const start = toMillis(from)
    const end = toMillis(to)

    if (start === null || end === null || end < start) {
        return null
    }

    return Math.round(((end - start) / 60000) * 10) / 10
}

export function attentionMinutes(ticket) {
    if (ticket.status !== 'DONE') {
        return null
    }

    return minutesBetween(ticket.startedAt, ticket.finishedAt)
}

export function averageAttentionMinutes(tickets) {
    const durations = tickets
        .map(attentionMinutes)
        .filter((minutes) => minutes !== null)

    if (durations.length === 0) {
        return null
    }

    const total = durations.reduce((sum, minutes) => sum + minutes, 0)
    return Math.round((total / durations.length) * 10) / 10
}

export function buildSummary(tickets, counterNames = {}, counterIds = []) {
    const groups = new Map(counterIds.map((counterId) => [counterId, []]))

    for (const ticket of tickets) {
        const counterId = ticket.counterId ?? NO_COUNTER_ID

        if (!groups.has(counterId)) {
            groups.set(counterId, [])
        }

        groups.get(counterId).push(ticket)
    }

    const counters = [...groups.entries()]
        .filter(([counterId, items]) => counterId !== NO_COUNTER_ID
            || items.some((ticket) => ticket.status === 'DONE' || ticket.status === 'CANCELLED'))
        .map(([counterId, items]) => ({
        counterId: counterId === NO_COUNTER_ID ? null : counterId,
        counterName: counterId === NO_COUNTER_ID
            ? 'Sin módulo asignado'
            : counterNames[counterId] ?? 'Módulo eliminado',
        attended: items.filter((ticket) => ticket.status === 'DONE').length,
        cancelled: items.filter((ticket) => ticket.status === 'CANCELLED').length,
        averageAttentionMinutes: averageAttentionMinutes(items)
    }))

    counters.sort((a, b) => {
        if (a.counterId === null) return 1
        if (b.counterId === null) return -1
        return a.counterName.localeCompare(b.counterName, 'es', { numeric: true })
    })

    return {
        counters,
        totals: {
            attended: counters.reduce((sum, counter) => sum + counter.attended, 0),
            cancelled: counters.reduce((sum, counter) => sum + counter.cancelled, 0),
            averageAttentionMinutes: averageAttentionMinutes(tickets)
        }
    }
}
