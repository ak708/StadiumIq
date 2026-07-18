import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import TicketTransfer from '@/components/TicketTransfer'
import LiveMatchCenter from '@/components/LiveMatchCenter'
// lucide-react removed
import { IconContext } from 'react-icons';
import { cn } from '@/lib/utils'
import { db, isFirebaseConfigured } from '@/utils/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

import { LuBot, LuCircle, LuUsers, LuShield, LuHardHat, LuSettings, LuArrowUpRight, LuArrowDownRight, LuZap, LuGift, LuCalendarCheck, LuBus } from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext'

const STATS = [
  { icon: '??', value: '82,547', label: 'Fans Today', delta: '+2.3%', dir: 'up', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { icon: '??', value: '94%',    label: 'Gate Capacity', delta: 'HIGH', dir: 'down', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { icon: '???', value: '2,341',  label: 'Parking Free',  delta: '34% available', dir: 'up', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { icon: '??', value: '47',     label: 'Languages Active', delta: 'Live translations', dir: 'up', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { icon: '??', value: '1,284',  label: 'AI Queries/hr',  delta: '+18% vs last match', dir: 'up', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { icon: '?', value: '98.7%',  label: 'System Uptime',  delta: 'All services healthy', dir: 'up', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
]

const QUICK_ACTIONS = [
  { icon: () => <LuBot />,           label: 'Ask FanAssist AI',  path: '/fan-assist', color: 'text-cyan-400 bg-cyan-400/10' },
  { icon: () => <LuCircle />, label: 'Book Parking',      path: '/parking',    color: 'text-emerald-400 bg-emerald-400/10' },
  { icon: () => <LuUsers />,         label: 'CrowdOps Dashboard',path: '/crowd-ops',  color: 'text-amber-400 bg-amber-400/10' },
  { icon: () => <LuShield />,        label: 'Safety Map',        path: '/safety',     color: 'text-red-400 bg-red-400/10' },
  { icon: () => <LuHardHat />,       label: 'Staff Briefing',    path: '/staff-brief',color: 'text-purple-400 bg-purple-400/10' },
  { icon: () => <LuSettings />,      label: 'Admin Portal',      path: '/admin',      color: 'text-gray-400 bg-gray-400/10' },
]

const DEFAULT_MATCH_INFO = {
  home: { logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', name: 'Arsenal' },
  away: { logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png', name: 'Man City' },
  name: 'Arsenal vs Manchester City',
  venue: 'Emirates Stadium',
  date: null,
  status: 'SCHEDULED',
  state: 'pre',
  homeScore: 0,
  awayScore: 0,
}

const DEFAULT_ALERTS = [
  { level: 'danger',  text: 'Gate C surge — 96% capacity. CrowdOps recommending Gate D diversion.' },
  { level: 'warning', text: 'Zone B2 parking at 85% — 15 accessible spots remaining.' },
  { level: 'info',    text: 'PA announcement translated to 8 languages successfully.' },
  { level: 'success', text: 'Medical team response at Section 12 completed in 2m 41s.' },
]

export default function Dashboard({ ctx }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [matchData, setMatchData] = useState(DEFAULT_MATCH_INFO)
  
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(doc(db, 'match_data', 'live_feed'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.match) {
          setMatchData({
            name: data.match.name,
            venue: data.match.venue || DEFAULT_MATCH_INFO.venue,
            date: data.match.date,
            status: data.match.status,
            state: data.match.state,
            home: {
              name: data.match.home.abbreviation || data.match.home.name,
              logo: data.match.home.logo,
            },
            away: {
              name: data.match.away.abbreviation || data.match.away.name,
              logo: data.match.away.logo,
            },
            homeScore: data.match.home.score || 0,
            awayScore: data.match.away.score || 0,
          })
        }
      }
    })
    return () => unsub()
  }, [])
  
  const displayAlerts = DEFAULT_ALERTS
  const isLive = true // Demo override so the user can test live features! matchData.state === 'in'
  const isPremium = profile?.ticket?.type === 'premium'

  const PREMIUM_ACTIONS = [
    { icon: () => <LuGift />, label: 'Signed Merch', path: '#', color: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' },
    { icon: () => <LuCalendarCheck />, label: 'Meet & Greet', path: '#', color: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' },
    { icon: () => <LuBus />, label: 'VIP Shuttle', path: '#', color: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {isLive && <Badge variant="danger"><span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />LIVE</Badge>}
          <Badge variant="primary">Premier League</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">StadiumIQ Control Center</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">Real-time AI operations for {matchData.venue}</p>
      </div>

      {/* Match Card */}
      <Card className="bg-gradient-to-br from-blue-900/40 to-indigo-900/30 border-cyan-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="relative p-6 md:p-8 text-center">
          <div className="text-[0.65rem] font-bold text-slate-900/60 dark:text-white/60 mb-2 uppercase tracking-[0.2em]">
            {matchData.name}
          </div>
          <div className="text-sm font-semibold text-brand-primary mb-6">
            {matchData.venue} • {matchData.date ? new Date(matchData.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBD'}
          </div>
          <div className="flex items-center justify-center gap-6 md:gap-16">
            <div className="text-center w-24 md:w-32 flex flex-col items-center">
              <img src={matchData.home.logo} alt={matchData.home.name} className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
              <div className="font-display font-bold text-slate-900 dark:text-white text-base md:text-lg mt-3 truncate w-full">{matchData.home.name}</div>
            </div>
            
            <div className="text-center flex flex-col items-center min-w-[100px]">
              <div className="font-display font-black text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tighter drop-shadow-glow-primary">
                {matchData.homeScore} – {matchData.awayScore}
              </div>
              <Badge variant={isLive ? "success" : "secondary"} className={cn("mt-3", isLive && "animate-pulse")}>
                {matchData.status} {isLive ? "??" : ""}
              </Badge>
            </div>

            <div className="text-center w-24 md:w-32 flex flex-col items-center">
              <img src={matchData.away.logo} alt={matchData.away.name} className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
              <div className="font-display font-bold text-slate-900 dark:text-white text-base md:text-lg mt-3 truncate w-full">{matchData.away.name}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Accessibility Center (Only shows if match is live) */}
      <LiveMatchCenter ctx={ctx} isLive={isLive} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS.map((s, i) => (
          <Card key={i} className="p-4 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform">
            <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center text-lg shadow-sm', s.color)}>
              {s.icon}
            </div>
            <div className="font-display font-bold text-2xl text-slate-900 dark:text-white mt-1">{s.value}</div>
            <div className="text-xs font-semibold text-slate-900/60 dark:text-white/60 uppercase tracking-wider">{s.label}</div>
            <div className={cn(
              'flex items-center gap-1 text-[0.65rem] font-medium mt-auto pt-2 border-t border-slate-300 dark:border-white/5',
              s.dir === 'up' ? 'text-emerald-400' : 'text-red-400'
            )}>
              {s.dir === 'up' ? <LuArrowUpRight  className="w-3 h-3"  /> : <LuArrowDownRight  className="w-3 h-3"  />}
              {s.delta}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Live Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LuZap  className="w-4 h-4 text-brand-primary"  />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, path, color }) => (
              <button
                key={path}
                id={`quick-${path.replace('/', '')}`}
                onClick={() => navigate(path)}
                className="group flex items-center gap-3 p-4 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-all hover:-translate-y-0.5"
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-900/90 dark:text-white/90 group-hover:text-white text-left">{label}</span>
              </button>
            ))}
            {isPremium && PREMIUM_ACTIONS.map(({ icon: Icon, label, path, color }) => (
              <button
                key={label}
                className="group flex items-center gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all hover:-translate-y-0.5"
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-500 text-left">{label}</span>
              </button>
            ))}
          </div>
          <TicketTransfer />
        </div>

        {/* Live Alerts */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">System Alerts</h2>
          </div>
          <div className="flex flex-col gap-2">
            {displayAlerts.map((a, i) => (
              <div key={i} className={cn('alert', a.level)}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-80">{a.level}</div>
                  <div className="text-sm text-slate-900/90 dark:text-white/90 leading-snug">{a.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack Attribution */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-300 dark:border-white/10 mt-2">
        <span className="text-xs text-slate-900/40 dark:text-white/40 mr-1">Powered by</span>
        {['Gemini 2.0 Flash', 'ESPN API', 'Cloud Functions', 'Firestore', 'React'].map(svc => (
          <Badge key={svc} variant="secondary" className="text-[0.65rem]">{svc}</Badge>
        ))}
      </div>
    </div>
  )
}
