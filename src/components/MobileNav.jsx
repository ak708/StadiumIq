import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
// lucide-react removed
import { IconContext } from 'react-icons';

import { LuLayoutDashboard, LuBot, LuCircle, LuShield, LuUsers, LuUserCheck, LuShoppingBag } from 'react-icons/lu';

const MOBILE_NAV = [
  { icon: () => <LuLayoutDashboard />, label: 'Home',    path: '/dashboard', role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuShoppingBag />,     label: 'Hub',     path: '/hub', role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuBot />,             label: 'AI',      path: '/fan-assist', role: ['fan', 'volunteer', 'staff', 'admin'] },
  { icon: () => <LuCircle />,   label: 'Parking', path: '/parking', role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuShield />,          label: 'Safety',  path: '/safety', role: ['fan', 'staff', 'admin'] },
  { icon: () => <LuUsers />,           label: 'Ops',     path: '/crowd-ops', role: ['staff', 'admin'] },
  { icon: () => <LuUserCheck />,       label: 'Vols',    path: '/volunteers', role: ['admin', 'volunteer'] },
]

export default function MobileNav({ activePage, setActivePage }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const userRole = profile?.role || 'fan'

  const items = MOBILE_NAV.filter(item => {
    if (!item.role) return true;
    const roles = Array.isArray(item.role) ? item.role : [item.role]
    if (userRole === 'admin') return true;
    if (userRole === 'staff') return roles.includes('staff') || roles.includes('fan');
    if (userRole === 'volunteer') return roles.includes('volunteer');
    return roles.includes('fan');
  })

  return (
    <nav className="mobile-nav pb-safe">
      {items.map(({ icon: Icon, label, path }) => {
        const key = path.replace('/', '')
        const isActive = activePage === key
        return (
          <button
            key={path}
            id={`mobile-nav-${key}`}
            onClick={() => { navigate(path); setActivePage(key) }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[0.65rem] font-medium transition-all duration-200',
              isActive ? 'text-cyan-400' : 'text-slate-900/40 dark:text-white/40 hover:text-slate-900/70 dark:hover:text-white/70'
            )}
          >
            <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
            <span>{label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-cyan-400 rounded-t-full" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
