// Funciones puras
const TZ = 'America/Mexico_City'

// Devuelve 'AAAA-MM-DD' en zona horaria de México
export function buildDayKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date)
}

// formatTicketCode('A', 1) -> 'A-001'
export function formatTicketCode(prefix, number) {
    return `${prefix}-${String(number).padStart(3, 0)}`
}
