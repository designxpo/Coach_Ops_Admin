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
