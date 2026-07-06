import admin from 'firebase-admin'

// Safe singleton — Next.js hot-reload can call this module multiple times
function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local'
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

export function getAdminMessaging() {
  return admin.messaging(getAdminApp())
}

export function getAdminFirestore() {
  return admin.firestore(getAdminApp())
}

export function getAdminAuth() {
  return admin.auth(getAdminApp())
}

/** The one account allowed to call admin APIs — same predicate as firestore.rules isAdmin() */
export const ADMIN_EMAIL = 'priyeshmishraofficial@gmail.com'

/**
 * Verifies the Authorization: Bearer <Firebase ID token> header and requires
 * the admin account. Returns null when authorized, or an error message.
 * API routes are PUBLIC on Vercel — every admin route must call this first.
 */
export async function requireAdmin(authorizationHeader: string | null): Promise<string | null> {
  const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null
  if (!token) return 'Missing Authorization bearer token'
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (decoded.email !== ADMIN_EMAIL) return 'Not authorized'
    return null
  } catch {
    return 'Invalid or expired token'
  }
}
