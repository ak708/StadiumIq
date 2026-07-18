import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../utils/firebase'

// ============================================================
// DEMO USERS (used when Firebase is not configured)
// ============================================================
const DEMO_USERS = {
  'fan@demo.com':   { password: 'demo123', role: 'fan',   name: 'Alex Fan',      avatar: '👤', lang: 'en' },
  'staff@demo.com': { password: 'demo123', role: 'staff',  name: 'Maria Steward', avatar: '👷', lang: 'es' },
  'admin@demo.com': { password: 'demo123', role: 'admin',  name: 'Omar Admin',    avatar: '⚙️', lang: 'ar' },
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================
export const ROLES = {
  fan:   { label: 'Fan',            color: 'var(--brand-primary)', icon: '👤', pages: ['dashboard', 'fan-assist', 'parking', 'safety'] },
  staff: { label: 'Staff / Volunteer', color: '#A78BFA',           icon: '👷', pages: ['dashboard', 'fan-assist', 'parking', 'safety', 'staff-brief', 'crowd-ops'] },
  admin: { label: 'Stadium Admin',  color: '#FCD34D',              icon: '⚙️', pages: ['dashboard', 'fan-assist', 'parking', 'safety', 'staff-brief', 'crowd-ops', 'admin'] },
}

// ============================================================
// AUTH CONTEXT
// ============================================================
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase user object
  const [profile, setProfile] = useState(null) // { role, name, avatar, tickets: [] }
  const [activeTicketId, setActiveTicketId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load user profile from Firestore
  async function loadProfile(firebaseUser) {
    if (!firebaseUser || !isFirebaseConfigured) return null
    try {
      const ref = doc(db, 'users', firebaseUser.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data()
      }
      // First time login — create profile as fan
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        avatar: firebaseUser.photoURL || null,
        role: 'fan',
        tickets: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }
      await setDoc(ref, newProfile)
      return newProfile
    } catch (err) {
      console.error('Profile load error:', err)
      return null
    }
  }

  // Watch Firebase auth state
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const p = await loadProfile(firebaseUser)
        setProfile(p)
        if (p?.tickets?.length > 0) {
          setActiveTicketId(p.tickets[0].code)
        }
      } else {
        setUser(null)
        setProfile(null)
        setActiveTicketId(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // ============================================================
  // SIGN IN WITH GOOGLE
  // ============================================================
  async function signInWithGoogle() {
    if (!isFirebaseConfigured) {
      // Demo mode
      setUser({ uid: 'demo-fan', email: 'fan@demo.com' })
      setProfile({ role: 'fan', name: 'Demo Fan', avatar: null })
      return
    }
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const p = await loadProfile(result.user)
      setProfile(p)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // ============================================================
  // SIGN IN WITH EMAIL
  // ============================================================
  async function signInWithEmail(email, password) {
    setError('')

    // Demo mode — check hardcoded demo users
    if (!isFirebaseConfigured) {
      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        setUser({ uid: `demo-${demo.role}`, email })
        setProfile({ role: demo.role, name: demo.name, avatar: null })
        return { role: demo.role }
      }
      throw new Error('Invalid demo credentials. Try fan@demo.com / staff@demo.com / admin@demo.com with password: demo123')
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const p = await loadProfile(result.user)
      setProfile(p)
      if (p?.tickets?.length > 0) {
        setActiveTicketId(p.tickets[0].code)
      }
      return p
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // ============================================================
  // REGISTER WITH EMAIL
  // ============================================================
  async function registerWithEmail(email, password, name, role = 'fan', ticketCode = '') {
    setError('')
    if (!isFirebaseConfigured) {
      throw new Error('Registration requires Firebase setup. Use demo accounts for now.')
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const newProfile = {
        uid: result.user.uid,
        email,
        name,
        avatar: null,
        role,
        tickets: ticketCode ? [{
          code: ticketCode,
          type: ticketCode.toUpperCase().includes('VIP') ? 'premium' : 'standard',
          match: 'Linked Match (TBD)',
          date: 'TBD',
          time: 'TBD',
          seat: 'TBD'
        }] : [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', result.user.uid), newProfile)
      setProfile(newProfile)
      if (newProfile.tickets.length > 0) {
        setActiveTicketId(newProfile.tickets[0].code)
      }
      return newProfile
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // ============================================================
  // SIGN OUT
  // ============================================================
  async function logout() {
    if (!isFirebaseConfigured) {
      setUser(null)
      setProfile(null)
      return
    }
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  // ============================================================
  // ROLE HELPERS
  // ============================================================
  const role = profile?.role || null
  const isAdmin   = role === 'admin'
  const isStaff   = role === 'staff' || role === 'admin'
  const isFan     = !!role
  const canAccess = (page) => {
    if (!role) return ['dashboard', 'fan-assist', 'safety'].includes(page)
    return ROLES[role]?.pages.includes(page) ?? false
  }

  // ============================================================
  // REFRESH PROFILE
  // ============================================================
  async function refreshProfile() {
    if (user) {
      const p = await loadProfile(user)
      setProfile(p)
      if (p?.tickets?.length > 0 && (!activeTicketId || !p.tickets.find(t => t.code === activeTicketId))) {
        setActiveTicketId(p.tickets[0].code)
      }
    }
  }

  const value = {
    user, profile, loading, error,
    role, isAdmin, isStaff, isFan,
    canAccess,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
    refreshProfile,
    isConfigured: isFirebaseConfigured,
    activeTicketId,
    setActiveTicketId,
    activeTicket: profile?.tickets?.find(t => t.code === activeTicketId) || null,
    // Convenience
    displayName: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Guest',
    avatarUrl: profile?.avatar || user?.photoURL || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
