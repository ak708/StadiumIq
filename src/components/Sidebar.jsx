import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
// lucide-react removed

import { LuLayoutDashboard, LuBot, LuCircle, LuShield, LuUsers, LuBookOpen, LuSettings, LuUserCheck, LuTrophy, LuShoppingBag, LuTicket } from 'react-icons/lu';

const NAV_ITEMS = [
  { icon: () => <LuLayoutDashboard />, label: 'Dashboard',    path: '/dashboard',  role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuBot />,             label: 'FanAssist AI', path: '/fan-assist', role: ['fan', 'volunteer', 'staff', 'admin'] },
  { icon: () => <LuTicket />,          label: 'Buy Tickets',  path: '/tickets',    role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuShoppingBag />,     label: 'Stadium Hub',  path: '/hub',        role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuCircle />,          label: 'Smart Parking',path: '/parking',    role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuShield />,          label: 'Safety Map',   path: '/safety',     role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuUsers />,           label: 'Crowd Ops',    path: '/crowd-ops',  role: ['staff', 'admin'] },
  { icon: () => <LuBookOpen />,        label: 'Staff Brief',  path: '/staff-brief',role: ['staff', 'volunteer', 'admin'] },
  { icon: () => <LuSettings />,        label: 'Admin Parking',path: '/admin',      role: ['admin'] },
  { icon: () => <LuUserCheck />,       label: 'Volunteers',   path: '/volunteers', role: ['admin', 'volunteer'] },
]

export default function Sidebar({ activePage, setActivePage }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const userRole = profile?.role || 'fan'
  const isAdmin = userRole === 'admin'

  const visible = NAV_ITEMS.filter(item => {
    if (!item.role) return true;
    const roles = Array.isArray(item.role) ? item.role : [item.role]
    if (userRole === 'admin') return true;
    if (userRole === 'staff') return roles.includes('staff') || roles.includes('fan');
    if (userRole === 'volunteer') return roles.includes('volunteer');
    return roles.includes('fan');
  })

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-lg shadow-glow-primary">
          <LuTrophy  className="w-5 h-5 text-slate-900 dark:text-white"  />
        </div>
        <div>
          <div className="font-display font-bold text-slate-900 dark:text-white text-sm leading-tight">StadiumIQ</div>
          <div className="text-[0.65rem] text-slate-900/40 dark:text-white/40 leading-tight">FIFA World Cup 2026</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[0.65rem] font-semibold text-slate-900/30 dark:text-white/30 uppercase tracking-widest">Navigation</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visible.map(({ icon: Icon, label, path, role }) => (
          <button
            key={path}
            id={`nav-${path.replace('/', '')}`}
            onClick={() => { navigate(path); setActivePage(path.replace('/', '')) }}
            className={cn(
              'sidebar-item w-full text-left',
              activePage === path.replace('/', '') && 'active'
            )}
          >
            <span className={cn(
              'sidebar-item-icon',
              activePage === path.replace('/', '')
                ? 'bg-cyan-400/15 text-cyan-400'
                : 'bg-slate-200 dark:bg-white/5 text-slate-900/50 dark:text-white/50'
            )}>
              <Icon className="w-4 h-4" />
            </span>
            <span className="text-sm">{label}</span>
            {role === 'admin' && (
              <span className="ml-auto text-[0.6rem] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">Admin</span>
            )}
            {role === 'staff' && !isAdmin && (
              <span className="ml-auto text-[0.6rem] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">Staff</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom attribution */}
      <div className="p-4 border-t border-slate-300 dark:border-white/5">
        <div className="text-[0.65rem] text-slate-900/25 dark:text-white/25 text-center space-y-0.5">
          <div>Powered by Google Gemini</div>
          <div>Built on Firebase · Google Cloud</div>
        </div>
      </div>
    </div>
  )
}
