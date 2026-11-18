// Personas delante de un ticket: los tickets WAITING del mismo servicio y día con número menor.
// Solo un ticket en espera tiene gente delante; en cualquier otro estado devuelve 0.
// calculateAhead({ status: 'WAITING', number: 5 }, [{ number: 2 }, { number: 4 }, { number: 5 }, { number: 9 }]) -> 2
export function calculateAhead(ticket, waiting) {
    if (ticket.status !== 'WAITING') {
        return 0
    }

    return waiting.filter((item) => item.number < ticket.number).length
}
