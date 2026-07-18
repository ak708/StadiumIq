import { useAuth } from '@/context/AuthContext'
import { LuTicket } from 'react-icons/lu'

export default function MatchSelector() {
  const { profile, activeTicketId, setActiveTicketId, role } = useAuth()

  // Only show for fans who have tickets
  if (role !== 'fan' || !profile?.tickets || profile.tickets.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-white/10 rounded-xl border border-slate-300 dark:border-white/10">
      <LuTicket className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
      <select
        value={activeTicketId || ''}
        onChange={(e) => setActiveTicketId(e.target.value)}
        className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none pr-4"
      >
        {profile.tickets.map((t) => (
          <option key={t.code} value={t.code} className="text-slate-900 bg-white dark:bg-slate-800">
            {t.match} ({t.type === 'premium' ? 'VIP' : 'Standard'})
          </option>
        ))}
      </select>
    </div>
  )
}
