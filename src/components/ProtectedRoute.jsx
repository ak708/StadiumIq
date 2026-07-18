import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
// lucide-react removed
import { IconContext } from 'react-icons';
import { Button } from '@/components/ui/button'

import { LuLock } from 'react-icons/lu';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--bg-base)]">
        <div className="text-4xl">🏆</div>
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <div className="text-xs text-slate-900/50 dark:text-white/50">Loading StadiumIQ...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userRole = profile?.role || 'fan'

  // Ticket Gate: Fans must have a ticket to access anything other than /tickets
  const hasTickets = profile?.tickets?.length > 0 || profile?.ticket // fallback for old data
  if (userRole === 'fan' && !hasTickets && location.pathname !== '/tickets') {
    return <Navigate to="/tickets" replace />
  }

  if (requiredRole) {
    const userRole = profile?.role || 'fan'
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    let hasAccess = false

    if (userRole === 'admin') {
      hasAccess = true // Admins see everything
    } else if (userRole === 'staff') {
      hasAccess = roles.includes('staff') || roles.includes('fan') || !requiredRole
    } else if (userRole === 'volunteer') {
      hasAccess = roles.includes('volunteer')
    } else {
      // fan
      hasAccess = roles.includes('fan') || !requiredRole
    }

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4 p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-2">
            <LuLock  className="w-8 h-8"  />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-sm text-slate-900/50 dark:text-white/50 max-w-xs">
            This section requires <strong className="text-brand-primary">{requiredRole}</strong> access.
            Your current role is <strong className="text-slate-900 dark:text-white">{userRole}</strong>.
          </p>
          <p className="text-xs text-slate-900/40 dark:text-white/40 mt-2">
            Contact your stadium administrator to get elevated access.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      )
    }
  }

  return children
}
