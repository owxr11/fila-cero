import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'

const refreshTokensCollection = db.collection(COLLECTIONS.refreshTokens)

// Se guarda el hash del refresh token, nunca el token original
export async function saveRefreshToken({
    userId,
    tokenHash
}) {
    await refreshTokensCollection.doc(tokenHash).set({
        userId,
        revoked: false,
        createdAt: FieldValue.serverTimestamp()
    })
}

export async function findRefreshToken(tokenHash) {
    const token = await refreshTokensCollection.doc(tokenHash).get()
    if (!token.exists) {
        return null
    }
    return {
        id: token.id,
        ...token.data()
    }
}

export async function revokeRefreshToken(tokenHash) {
    await refreshTokensCollection.doc(tokenHash).set({
        revoked: true,
        revokedAt: FieldValue.serverTimestamp()
    }, {
        merge: true
    })
}
