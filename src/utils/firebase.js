// ============================================================
// Firebase Configuration
// Add your Firebase project config here after creating
// a project at https://console.firebase.google.com
//
// HOW TO GET THESE VALUES:
// 1. Go to console.firebase.google.com
// 2. Create project → "stadiumiq-wc2026"
// 3. Add Web App → copy the firebaseConfig object
// 4. Paste the values into your .env file
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Check if all required config is present
const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let app, auth, db, storage, googleProvider

if (isFirebaseConfigured) {
  app           = initializeApp(firebaseConfig)

  if (typeof window !== 'undefined') {
    // Initialize App Check
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'missing-site-key'),
        isTokenAutoRefreshEnabled: true
      });
    } catch (e) {
      console.warn('App Check failed to initialize:', e);
    }
  }

  auth          = getAuth(app)
  db            = getFirestore(app)
  storage       = getStorage(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.addScope('email')
  googleProvider.addScope('profile')
} else {
  console.warn('Firebase not configured. Auth will run in demo mode.')
}

export { app, auth, db, storage, googleProvider, isFirebaseConfigured }
