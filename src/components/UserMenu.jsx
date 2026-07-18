import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
// lucide-react removed
import { IconContext } from 'react-icons';

import { LuShield, LuHardHat, LuUser, LuChevronDown, LuLogOut } from 'react-icons/lu';

const Shield = (props) => <LuShield {...props} />;
const HardHat = (props) => <LuHardHat {...props} />;
const User = (props) => <LuUser {...props} />;

export default function UserMenu() {
  const { displayName, profile, logout, isAdmin, isStaff } = useAuth()
  const [open, setOpen] = useState(false)

  const roleLabel = isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Fan'
  const RoleIcon  = isAdmin ? Shield : isStaff ? HardHat : User
  const roleColor = isAdmin ? 'text-amber-400' : isStaff ? 'text-purple-400' : 'text-cyan-400'

  return (
    <div className="relative">
      <button
        id="btn-user-menu"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-sm">
          {profile?.avatar || <LuUser  className="w-3.5 h-3.5 text-slate-900/60 dark:text-white/60"  />}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-slate-900/90 dark:text-white/90 leading-tight max-w-[100px] truncate">{displayName}</div>
          <div className={cn('text-[0.6rem] leading-tight flex items-center gap-1', roleColor)}>
            <RoleIcon className="w-2.5 h-2.5" />
            {roleLabel}
          </div>
        </div>
        <LuChevronDown  className={cn('w-3.5 h-3.5 text-slate-900/40 dark:text-white/40 transition-transform duration-200', open && 'rotate-180')}  />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-300 dark:border-white/10 bg-[#111827] shadow-card backdrop-blur-xl overflow-hidden animate-fade-in">
            <div className="px-3 py-2.5 border-b border-slate-300 dark:border-white/10">
              <div className="text-xs font-semibold text-slate-900/90 dark:text-white/90 truncate">{displayName}</div>
              <div className={cn('text-[0.65rem] flex items-center gap-1 mt-0.5', roleColor)}>
                <RoleIcon className="w-3 h-3" />
                {roleLabel}
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LuLogOut  className="w-3.5 h-3.5"  />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
