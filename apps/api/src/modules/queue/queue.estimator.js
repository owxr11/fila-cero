const DEFAULT_MINUTES_PER_PERSON = 5
const MAX_HISTORY_SAMPLES = 10


function toDate(value) {
    if (!value) return null
    if (typeof value.toDate === 'function') return value.toDate()
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value)
        return isNaN(d.getTime()) ? null : d
    }
    return null
}


export function extractDurationInMinutes(ticket) {
    if (typeof ticket === 'number') {
        return ticket >= 0 ? ticket : null
    }

    if (!ticket || typeof ticket !== 'object') {
        return null
    }

    if (typeof ticket.durationMinutes === 'number') {
        return ticket.durationMinutes >= 0 ? ticket.durationMinutes : null
    }

    if (typeof ticket.duration === 'number') {
        if (ticket.duration < 0) return null
        return ticket.duration > 30 ? ticket.duration / 60 : ticket.duration
    }

    if (typeof ticket.durationSeconds === 'number') {
        return ticket.durationSeconds >= 0 ? ticket.durationSeconds / 60 : null
    }

    const end = toDate(ticket.finishedAt)
    const start = toDate(ticket.startedAt) || toDate(ticket.calledAt) || toDate(ticket.createdAt)

    if (end && start) {
        const diffMs = end.getTime() - start.getTime()
        if (diffMs >= 0) {
            return diffMs / (1000 * 60)
        }
    }

    return null
}

export function estimateWaitTime(aheadOrOptions = 0, activeCountersParam = 1, recentTicketsParam = []) {
    let ahead
    let activeCounters
    let recentTickets

    if (typeof aheadOrOptions === 'object' && aheadOrOptions !== null && !Array.isArray(aheadOrOptions)) {
        ahead = aheadOrOptions.ahead ?? aheadOrOptions.peopleAhead ?? 0
        activeCounters = aheadOrOptions.activeCounters ?? aheadOrOptions.activeCountersCount ?? 1
        recentTickets = aheadOrOptions.recentTickets ?? aheadOrOptions.history ?? aheadOrOptions.durations ?? []
    } else {
        ahead = aheadOrOptions ?? 0
        activeCounters = activeCountersParam ?? 1
        recentTickets = recentTicketsParam ?? []
    }

    const safeAhead = Math.max(0, Number(ahead) || 0)
    const safeCounters = Math.max(1, Number(activeCounters) || 1)

    const validDurations = []
    if (Array.isArray(recentTickets)) {
        for (const item of recentTickets) {
            const duration = extractDurationInMinutes(item)
            if (duration !== null && !isNaN(duration)) {
                validDurations.push(duration)
                if (validDurations.length === MAX_HISTORY_SAMPLES) {
                    break
                }
            }
        }
    }

    const hasHistory = validDurations.length > 0
    const ticketsSampled = validDurations.length
    const isDefault = !hasHistory

    const averageDurationMinutes = hasHistory
        ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
        : DEFAULT_MINUTES_PER_PERSON

    let estimatedMinutes = 0
    if (safeAhead > 0) {
        const rawMinutes = (averageDurationMinutes * safeAhead) / safeCounters
        estimatedMinutes = Math.round(rawMinutes)
    }

    return {
        estimatedMinutes,
        isDefault,
        ticketsSampled,
        // Alias de compatibilidad y conveniencia
        estimatedWaitTimeMinutes: estimatedMinutes,
        isDefaultEstimate: isDefault,
        ticketsUsed: ticketsSampled,
        averageDurationMinutes
    }
}

// Alias para compatibilidad de nombres
export const calculateEstimatedWaitTime = estimateWaitTime
