import { useState } from 'react'
import { speakText } from '@/utils/gemini'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { LuDoorOpen, LuStethoscope, LuFireExtinguisher, LuUsers, LuAccessibility, LuShield, LuNavigation, LuVolume2, LuChevronDown, LuChevronRight, LuPlay, LuClock } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const SAFETY_ITEMS = [
  {
    category: 'Emergency Exits',
    icon: () => <LuDoorOpen />,
    color: 'bg-red-500/15 text-red-400',
    items: [
      { name: 'Exit A1 — Main', location: 'Gate A, Level 0', distance: '80m', direction: 'North', open: true },
      { name: 'Exit B2 — East',  location: 'Gate B, Level 1', distance: '120m', direction: 'East',  open: true },
      { name: 'Exit C3 — South', location: 'Gate C, Level 0', distance: '200m', direction: 'South', open: true },
      { name: 'Exit D4 — West',  location: 'Gate D, Level 0', distance: '95m',  direction: 'West',  open: true },
    ],
  },
  {
    category: 'Medical Stations',
    icon: () => <LuStethoscope />,
    color: 'bg-emerald-500/15 text-emerald-400',
    items: [
      { name: 'Medical Post A',  location: 'Gate A, Level 1', distance: '150m',  direction: 'North', open: true },
      { name: 'Medical Post C',  location: 'Gate C, Level 2', distance: '250m',  direction: 'East',  open: true },
      { name: 'First Aid — Main', location: 'Main Concourse', distance: '180m', direction: 'Center', open: true },
    ],
  },
  {
    category: 'Fire Extinguishers',
    icon: () => <LuFireExtinguisher />,
    color: 'bg-amber-500/15 text-amber-400',
    items: [
      { name: 'Extinguisher A3', location: 'Section 103, Pillar 3', distance: '30m',  direction: 'Left of Section 103' },
      { name: 'Extinguisher B7', location: 'Section 110, Pillar 7', distance: '45m',  direction: 'Right of Section 110' },
      { name: 'Extinguisher C2', location: 'Concourse C, Bay 2',    distance: '60m',  direction: 'Near Gate C elevator' },
    ],
  },
  {
    category: 'Safety Assembly Points',
    icon: () => <LuUsers />,
    color: 'bg-cyan-500/15 text-cyan-400',
    items: [
      { name: 'Assembly Point A', location: 'Parking Zone A, Open Air', distance: '350m', direction: 'North Car Park' },
      { name: 'Assembly Point B', location: 'East Plaza',                distance: '280m', direction: 'East of Gate B' },
      { name: 'Assembly Point C', location: 'West Stadium Road',         distance: '400m', direction: 'West car park' },
    ],
  },
  {
    category: 'Accessible Facilities',
    icon: () => <LuAccessibility />,
    color: 'bg-purple-500/15 text-purple-400',
    items: [
      { name: 'Accessible Entrance', location: 'Gate B, Level 0',    distance: '40m',  direction: 'Dedicated lane, no queue' },
      { name: 'Accessible Toilets',  location: 'All levels, Gate B/D', distance: '60m', direction: 'Near lifts' },
      { name: 'Viewing Platform',    location: 'Section 106, Level 2', distance: '200m', direction: 'Lift at Gate B' },
    ],
  },
]

const DIRECTIONS = [
  { mode: '🚇 Metro', label: 'Metro Line 2 → Stadium Stop', eta: '35 min', recommendation: true },
  { mode: '🚌 Bus',   label: 'Bus Route 55 → Stadium Gate A', eta: '42 min', recommendation: false },
  { mode: '🚗 Drive', label: 'NJ Turnpike → Exit 16W → Stadium Blvd', eta: '51 min (match day +25 min)', recommendation: false },
  { mode: '🚴 Bike',  label: 'River Trail → Stadium West Entrance', eta: '28 min', recommendation: false },
  { mode: '🚶 Walk',  label: 'From NJ Transit Station', eta: '12 min', recommendation: false },
]

export default function SafetyMap({ ctx }) {
  const { audioMode, language } = ctx
  const [expanded, setExpanded] = useState('Emergency Exits')
  const [userAddress, setUserAddress] = useState('')
  const [showDirections, setShowDirections] = useState(false)
  const [activeTab, setActiveTab] = useState('safety') // safety | navigation

  const speakSafetyBriefing = () => {
    const text = 'Safety briefing for your section. The nearest fire exit is Exit A1, 80 meters north. The nearest medical station is Medical Post A, 150 meters north at Gate A Level 1. The safety assembly point is in Parking Zone A, 350 meters north. In case of emergency, follow staff instructions and proceed calmly to the nearest exit.'
    speakText(text, language)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="danger"><LuShield  className="w-3 h-3 mr-1"  /> Safety</Badge>
          <Badge variant="success">All Systems Operational</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Safety Map & Navigation</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">Emergency facilities, navigation, and real-time safety intelligence</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-300 dark:border-white/10 pb-4">
        <Button
          variant={activeTab === 'safety' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('safety')}
          className="gap-2"
        >
          <LuShield  className="w-4 h-4"  /> Safety Facilities
        </Button>
        <Button
          variant={activeTab === 'navigation' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('navigation')}
          className="gap-2"
        >
          <LuNavigation  className="w-4 h-4"  /> Home → Stadium
        </Button>
      </div>

      {activeTab === 'safety' && (
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Left: Safety Items */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiAlertTriangle  className="w-5 h-5 text-amber-400"  /> Emergency Facilities
              </h2>
              {audioMode && (
                <Button variant="secondary" size="sm" onClick={speakSafetyBriefing} className="gap-2 text-xs h-8">
                  <LuVolume2  className="w-3.5 h-3.5"  /> Speak Briefing
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {SAFETY_ITEMS.map((cat) => {
                const isExpanded = expanded === cat.category
                return (
                  <Card key={cat.category} className={cn('overflow-hidden transition-all', isExpanded ? 'border-brand-primary/50 bg-brand-primary/5' : '')}>
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-300 dark:hover:bg-white/5 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : cat.category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cat.color)}>
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-900/90 dark:text-white/90 text-sm">{cat.category}</span>
                        <Badge variant="primary" className="ml-2">{cat.items.length}</Badge>
                      </div>
                      {isExpanded ? <LuChevronDown  className="w-4 h-4 text-slate-900/40 dark:text-white/40"  /> : <LuChevronRight  className="w-4 h-4 text-slate-900/40 dark:text-white/40"  />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 flex flex-col gap-2">
                        {cat.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-300 dark:border-white/5 bg-slate-200 dark:bg-white/5">
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-300 dark:border-white/10', cat.color)}>
                              <cat.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</div>
                              <div className="text-xs text-slate-900/60 dark:text-white/60 truncate">{item.location}</div>
                              <div className="text-[0.65rem] text-slate-900/40 dark:text-white/40 truncate mt-0.5">{item.direction}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-sm text-slate-900/90 dark:text-white/90">{item.distance}</div>
                              {item.open !== undefined && (
                                <Badge variant={item.open ? 'success' : 'danger'} className="mt-1">{item.open ? 'OPEN' : 'CLOSED'}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Right: Map & Emergency */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 text-center">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-2">
                <LuShield  className="w-4 h-4 text-brand-primary"  /> Stadium Safety Overview
              </h2>
              <div className="bg-slate-200 dark:bg-white/5 rounded-xl p-6 relative min-h-[280px] border border-slate-300 dark:border-white/10 flex items-center justify-center">
                {/* SVG Stadium Map */}
                <svg width="100%" viewBox="0 0 300 280" className="max-w-[300px]">
                  <ellipse cx="150" cy="140" rx="140" ry="120" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="2" />
                  <rect x="80" y="90" width="140" height="100" rx="8" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
                  <text x="150" y="142" textAnchor="middle" fill="rgba(16,185,129,0.8)" fontSize="10" fontWeight="bold">PITCH</text>
                  {[['A', 150, 15], ['B', 285, 140], ['C', 150, 265], ['D', 15, 140]].map(([label, x, y]) => (
                    <g key={label}>
                      <circle cx={x} cy={y} r="16" fill="rgba(239,68,68,0.3)" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
                      <text x={x} y={y + 5} textAnchor="middle" fontSize="14">🚪</text>
                      <text x={x} y={y + 20} textAnchor="middle" fontSize="8" fill="#FCA5A5">{label}</text>
                    </g>
                  ))}
                  {[[150, 50], [240, 200]].map(([x, y], i) => (
                    <g key={i}>
                      <rect x={x-12} y={y-12} width="24" height="24" rx="4" fill="rgba(16,185,129,0.3)" stroke="rgba(16,185,129,0.6)" strokeWidth="1" />
                      <text x={x} y={y + 4} textAnchor="middle" fontSize="12">🏥</text>
                    </g>
                  ))}
                  <circle cx="150" cy="200" r="8" fill="rgba(0,212,255,0.5)" stroke="var(--brand-primary)" strokeWidth="2">
                    <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <text x="150" y="220" textAnchor="middle" fontSize="8" fill="var(--brand-primary)" fontWeight="bold">YOU</text>
                </svg>
              </div>
            </Card>

            <Card className="p-5 border-red-500/30 bg-red-500/5">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4">
                <FiAlertTriangle  className="w-4 h-4"  /> Emergency
              </h3>
              <div className="flex gap-3">
                <Button variant="destructive" className="flex-1" onClick={() => alert('🚨 Emergency services alerted!\n\nStadium security and medical teams have been notified. Stay calm and follow staff instructions.')}>
                  Alert Emergency
                </Button>
                <Button variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => setExpanded('Emergency Exits')}>
                  Find Exit
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">👋 Deaf-Friendly Emergency Signs</h3>
              <p className="text-xs text-slate-900/50 dark:text-white/50 mb-4">Tap for pre-recorded American Sign Language videos.</p>
              <div className="grid grid-cols-2 gap-2">
                {['🚪 Evacuate', '🏥 Medical Help', '🔥 Fire Alert', '👮 Security'].map(label => (
                  <Button key={label} variant="secondary" size="sm" className="justify-start text-xs h-9" onClick={() => alert(`▶️ Playing: "${label}" in American Sign Language`)}>
                    <LuPlay  className="w-3 h-3 mr-1"  /> {label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'navigation' && (
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🏠 Home → Stadium Navigation</h2>
              <p className="text-xs text-slate-900/50 dark:text-white/50 mb-4">Enter starting location for AI-optimised match-day travel advice.</p>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Your Starting Location</label>
                <input
                  className="input-field"
                  placeholder="e.g. Manhattan, NY / Newark Penn Station"
                  value={userAddress}
                  onChange={e => setUserAddress(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowDirections(true)} disabled={!userAddress} className="w-full">
                <LuNavigation  className="w-4 h-4 mr-2"  /> Get AI Directions
              </Button>
            </Card>

            {showDirections && (
              <Card className="p-6 animate-fade-in border-brand-primary/30">
                <div className="flex flex-col gap-1 mb-4 pb-4 border-b border-slate-300 dark:border-white/10">
                  <div className="text-xs font-bold text-brand-primary uppercase tracking-wider">📍 From: {userAddress}</div>
                  <div className="text-xs text-slate-900/50 dark:text-white/50">🏟️ To: MetLife Stadium, East Rutherford, NJ</div>
                </div>

                <div className="alert warning mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">⚠️ Match Day Notice</div>
                    <div className="text-sm">Heavy crowds expected. Add 30–45 mins to normal travel time. Gate C experiencing delays — use Gate A or B.</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {DIRECTIONS.map((d, i) => (
                    <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl border', d.recommendation ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5')}>
                      <div className="text-2xl">{d.mode.split(' ')[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{d.mode.split(' ').slice(1).join(' ')}</span>
                          {d.recommendation && <Badge variant="primary" className="text-[0.55rem] px-1 h-4">RECOMMENDED</Badge>}
                        </div>
                        <div className="text-xs text-slate-900/60 dark:text-white/60 truncate">{d.label}</div>
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white shrink-0">{d.eta}</div>
                    </div>
                  ))}
                </div>

                {audioMode && (
                  <Button variant="secondary" className="w-full mt-4" onClick={() => speakText(`AI travel recommendation: Take Metro Line 2 to Stadium Stop. Expected travel time 35 minutes. Add 30 to 45 minutes for match day crowds. Use Gate A or Gate B on arrival.`, language)}>
                    <LuVolume2  className="w-4 h-4 mr-2"  /> Read Directions Aloud
                  </Button>
                )}
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🚌 Stadium Transport Hub</h2>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'NJ Transit Train', departs: 'Every 15 min from Penn Station', status: 'On Time', ok: true },
                  { name: 'Stadium Shuttle A', departs: 'From Meadowlands Station, every 8 min', status: 'On Time', ok: true },
                  { name: 'Stadium Shuttle B', departs: 'From Times Square, every 20 min', status: 'Delayed +12 min', ok: false },
                  { name: 'Rideshare Zone', departs: 'Gate D East Side — Uber/Lyft designated', status: 'Open', ok: true },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/5">
                    <div>
                      <div className="font-semibold text-sm text-slate-900/90 dark:text-white/90">{t.name}</div>
                      <div className="text-xs text-slate-900/50 dark:text-white/50">{t.departs}</div>
                    </div>
                    <Badge variant={t.ok ? 'success' : 'warning'}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🌐 Gate Status for Arrival</h2>
              <div className="flex flex-col gap-2">
                {[
                  { gate: 'Gate A', status: 'Recommended', wait: '~5 min', ok: true },
                  { gate: 'Gate B', status: 'Open',        wait: '~8 min', ok: true },
                  { gate: 'Gate C', status: 'OVERCROWDED', wait: '~35 min', ok: false },
                  { gate: 'Gate D', status: 'Accessible',  wait: '~3 min (accessible lane)', ok: true },
                ].map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/5">
                    <div className="font-semibold text-sm text-slate-900/90 dark:text-white/90">{g.gate}</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-900/50 dark:text-white/50">
                        <LuClock  className="w-3 h-3"  /> {g.wait}
                      </div>
                      <Badge variant={g.ok ? 'success' : 'danger'}>{g.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
