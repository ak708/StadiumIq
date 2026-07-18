import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
// lucide-react removed
import { IconContext } from 'react-icons';
import { cn } from '@/lib/utils'

import { LuFlaskConical, LuMail, LuGlobe, LuTrophy, LuUserPlus } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

const DEMO_CREDS = [
  { role: 'fan',   email: 'fan@demo.com',   password: 'demo123' },
  { role: 'staff', email: 'staff@demo.com', password: 'demo123' },
  { role: 'admin', email: 'admin@demo.com', password: 'demo123' },
]

export default function Login() {
  const { signInWithEmail, signInWithGoogle, registerWithEmail, isConfigured, error } = useAuth()
  const navigate = useNavigate()

  // ✅ FIX: Default to 'email' when Firebase is configured, 'demo' only in demo mode
  const [tab, setTab]           = useState(isConfigured ? 'email' : 'demo')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [localError, setLocalError] = useState('')

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true); setLocalError('')
    try { await signInWithEmail(email, password); navigate('/dashboard') }
    catch (err) { setLocalError(err.message) }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setLocalError('')
    try { 
      await registerWithEmail(email, password, name, 'fan', ticketId); 
      // If they registered with a ticket, go to dashboard, else go to tickets to buy one
      navigate(ticketId ? '/dashboard' : '/tickets') 
    }
    catch (err) { setLocalError(err.message) }
    finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); setLocalError('')
    try { await signInWithGoogle(); navigate('/dashboard') }
    catch (err) { setLocalError(err.message) }
    finally { setLoading(false) }
  }

  const handleDemo = async (cred) => {
    setLoading(true); setLocalError('')
    try { await signInWithEmail(cred.email, cred.password); navigate('/dashboard') }
    catch (err) { setLocalError(err.message) }
    finally { setLoading(false) }
  }

  const displayError = localError || error
  const tabs = [
    ...(isConfigured ? [] : [{ id: 'demo', label: 'Demo', icon: () => <LuFlaskConical /> }]),
    { id: 'email',  label: 'Login',  icon: () => <LuMail /> },
    ...(isConfigured ? [{ id: 'register', label: 'Register', icon: () => <LuUserPlus /> }] : []),
    ...(isConfigured ? [{ id: 'google', label: 'Google', icon: () => <LuGlobe /> }] : []),
  ]

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-glow-primary">
            <LuTrophy  className="w-6 h-6 text-slate-900 dark:text-white"  />
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 dark:text-white text-xl leading-tight">StadiumIQ</div>
            <div className="text-xs text-slate-900/40 dark:text-white/40">FIFA World Cup 2026 · AI Operations Platform</div>
          </div>
        </div>

        {/* Demo mode warning */}
        {!isConfigured && (
          <div className="flex gap-3 rounded-xl p-3 bg-amber-500/10 border border-amber-500/25">
            <FiAlertCircle  className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"  />
            <div>
              <div className="text-xs font-semibold text-amber-400">Demo Mode Active</div>
              <div className="text-xs text-amber-400/70 mt-0.5">Firebase not configured — use demo accounts below. Real auth requires Firebase setup.</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl p-1 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}-login`}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-200',
                tab === id
                  ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-900/40 dark:text-white/40 hover:text-slate-900/70 dark:hover:text-white/70'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Demo login */}
        {tab === 'demo' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-900/50 dark:text-white/50">Choose a role to log in instantly:</p>
            {DEMO_CREDS.map((cred) => {
              const roleInfo = ROLES[cred.role]
              const icons = { fan: '👤', staff: '👷', admin: '⚙️' }
              return (
                <button
                  key={cred.role}
                  id={`demo-login-${cred.role}`}
                  onClick={() => handleDemo(cred)}
                  disabled={loading}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-50 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${roleInfo.color}22`, border: `1px solid ${roleInfo.color}40` }}>
                    {icons[cred.role]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{roleInfo.label}</div>
                    <div className="text-xs text-slate-900/40 dark:text-white/40 mt-0.5">{cred.email} · demo123</div>
                  </div>
                  <span className="text-slate-900/30 dark:text-white/30 group-hover:text-white/70 transition-colors text-lg">→</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Email login */}
        {tab === 'email' && (
          <form onSubmit={handleEmail} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button id="btn-email-login" type="submit" disabled={loading} className="w-full justify-center mt-1">
              {loading ? '⏳ Signing in…' : 'Sign In →'}
            </Button>
            {!isConfigured && (
              <p className="text-xs text-slate-900/40 dark:text-white/40 text-center">
                Switch to Demo tab to try without an account.
              </p>
            )}
          </form>
        )}

        {/* Register login */}
        {tab === 'register' && isConfigured && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className="input-field"
                type="text"
                placeholder="Alex Fan"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-900/60 dark:text-white/60" htmlFor="reg-ticket">Ticket ID (Optional)</label>
              <input
                id="reg-ticket"
                className="input-field"
                type="text"
                placeholder="e.g. VIP-ABCD12"
                value={ticketId}
                onChange={e => setTicketId(e.target.value)}
              />
            </div>
            <Button id="btn-email-register" type="submit" disabled={loading} className="w-full justify-center mt-1">
              {loading ? '⏳ Registering…' : 'Create Fan Account →'}
            </Button>
          </form>
        )}

        {/* Google login */}
        {tab === 'google' && isConfigured && (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-slate-900/50 dark:text-white/50 text-center">
              Sign in with your Google account. New users are assigned the <strong className="text-slate-900/80 dark:text-white/80">Fan</strong> role automatically.
            </p>
            <Button id="btn-google-login" onClick={handleGoogle} disabled={loading} className="w-full justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </Button>
          </div>
        )}

        {/* Error */}
        {displayError && (
          <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            <FiAlertCircle  className="w-4 h-4 flex-shrink-0 mt-0.5"  />
            {displayError}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[0.65rem] text-slate-900/25 dark:text-white/25">
          Powered by Google Gemini · Firebase · Google Cloud
        </div>
      </div>
    </div>
  )
}
