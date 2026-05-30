import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            "AIzaSyDoL0oCduhmf3G6T10sdCCuU2NIV7g1_E8",
  authDomain:        "coachops-27a73.firebaseapp.com",
  projectId:         "coachops-27a73",
  storageBucket:     "coachops-27a73.firebasestorage.app",
  messagingSenderId: "566108244280",
  appId:             "1:566108244280:web:f9c48c0c548522846899cd",
  measurementId:     "G-TX5CGS7ZEW",
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const db   = getFirestore(app)
export const auth = getAuth(app)
