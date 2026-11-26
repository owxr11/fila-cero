import { z } from 'zod'

const STATUSES = ['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED']

function isRealDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const idFilter = (label) => z
    .string({ error: `${label} debe ser texto` })
    .trim()
    .min(1, `${label} no puede estar vacío`)
    .regex(/^[a-zA-Z0-9_-]+$/, `${label} contiene caracteres inválidos`)
    .optional()

export const historyFiltersSchema = z.object({
    query: z.object({
        date: z
            .string({ error: 'La fecha debe ser texto' })
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
            .refine(isRealDate, 'La fecha no existe')
            .optional(),
        serviceId: idFilter('El serviceId'),
        counterId: idFilter('El counterId'),
        status: z.enum(STATUSES, { error: `El estado debe ser uno de: ${STATUSES.join(', ')}` }).optional()
    })
})
