export const ROLES = Object.freeze({
    VISITOR: 'VISITOR',
    OPERATOR: 'OPERATOR',
    ADMIN: 'ADMIN'
})

export const permissionsByRole =
    Object.freeze({
        VISITOR: new Set([
            'tickets:create',
            'tickets:read.own'
        ]),
        OPERATOR: new Set([
            'tickets:read',
            'tickets:update',
            'counters:read'
        ]),
        ADMIN: new Set([
            '*'
        ])
    })
