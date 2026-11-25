// Cambios de estado permitidos: estado actual -> estados a los que puede pasar
export const ALLOWED_TRANSITIONS = Object.freeze({
    WAITING: ['CALLED', 'CANCELLED'],
    CALLED: ['IN_SERVICE', 'CANCELLED'],
    IN_SERVICE: ['DONE'],
    DONE: [],
    CANCELLED: []
})

// Estados en los que un ticket ocupa un módulo
export const ACTIVE_STATUSES = Object.freeze(['CALLED', 'IN_SERVICE'])

// canTransition('WAITING', 'CALLED') -> true
// canTransition('IN_SERVICE', 'CANCELLED') -> false
export function canTransition(from, to) {
    return Object.hasOwn(ALLOWED_TRANSITIONS, from) && ALLOWED_TRANSITIONS[from].includes(to)
}

// De los primeros tickets en espera de cada servicio, devuelve el de número más bajo.
// Si hay empate de número, gana el que aparece primero en la lista. Sin tickets devuelve null.
// pickLowestNumber([{ number: 3 }, { number: 1 }]) -> { number: 1 }
export function pickLowestNumber(tickets) {
    return tickets.reduce(
        (lowest, ticket) => (lowest === null || ticket.number < lowest.number ? ticket : lowest),
        null
    )
}