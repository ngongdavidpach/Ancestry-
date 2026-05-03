// src/lib/firebase.js
// ─────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS
// ─────────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g. "ancestry-system")
// 3. Register a Web App inside the project
// 4. Copy your firebaseConfig values below
// 5. Enable Authentication → Sign-in method → Google + Email/Password
// 6. Create Firestore Database (Start in production mode)
// 7. Set Firestore rules (see FIRESTORE_RULES.md)
// 8. Enable Storage (for photo uploads)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ⚠️  REPLACE WITH YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export default app
