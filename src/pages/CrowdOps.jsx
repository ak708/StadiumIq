import { useState, useEffect } from 'react'
import { chatWithGemini } from '@/utils/gemini'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { LuMap, LuNavigation, LuZap, LuActivity, LuMegaphone } from 'react-icons/lu';

// Simulated crowd data
function generateCrowdData() {
  const gates = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  return gates.map(g => ({
    gate: `Gate ${g}`,
    capacity: 100,
    current: Math.floor(Math.random() * 40) + 55,
    inflow: Math.floor(Math.random() * 150) + 50,
    outflow: Math.floor(Math.random() * 80) + 20,
  }))
}

const SECTION_GRID = [
  ['102', '103', '104', '105', '106', '107'],
  ['108', '109', '110', '111', '112', '113'],
  ['114', '—PITCH—', '—PITCH—', '—PITCH—', '—PITCH—', '115'],
  ['116', '—PITCH—', '—PITCH—', '—PITCH—', '—PITCH—', '117'],
  ['118', '119', '120', '121', '122', '123'],
  ['124', '125', '126', '127', '128', '129'],
]

const SECTION_DENSITY = {
  '102': 72, '103': 55, '104': 88, '105': 95, '106': 67, '107': 42,
  '108': 63, '109': 78, '110': 92, '111': 88, '112': 74, '113': 58,
  '114': 45, '115': 61, '116': 53, '117': 79,
  '118': 87, '119': 91, '120': 96, '121': 84, '122': 70, '123': 55,
  '124': 48, '125': 62, '126': 75, '127': 83, '128': 91, '129': 66,
}

function densityClass(pct) {
  if (pct === undefined) return ''
  if (pct >= 95) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
  if (pct >= 85) return 'bg-orange-500'
  if (pct >= 75) return 'bg-amber-400'
  if (pct >= 60) return 'bg-emerald-400'
  if (pct >= 40) return 'bg-emerald-600'
  return 'bg-emerald-900/50'
}

export default function CrowdOps() {
  const [crowdData, setCrowdData] = useState(generateCrowdData)
  const [aiAlerts, setAiAlerts] = useState([
    { id: 1, level: 'danger',  text: 'Gate C — 96% capacity. Recommend opening Gate D overflow lane immediately.', time: '20:47', gate: 'C' },
    { id: 2, level: 'warning', text: 'Section 120 approaching critical density. Pre-position stewards.', time: '20:45', gate: null },
    { id: 3, level: 'info',    text: 'Halftime expected in 8 minutes. Prepare concourse staffing increase.', time: '20:43', gate: null },
  ])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedGate, setSelectedGate] = useState('')
  const [announcementText, setAnnouncementText] = useState('')
  const [showAnnounce, setShowAnnounce] = useState(false)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCrowdData(prev => prev.map(g => ({
        ...g,
        current: Math.min(100, Math.max(40, g.current + Math.floor(Math.random() * 5) - 2)),
      })))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const analyzeWithAI = async () => {
    setIsAnalyzing(true)
    const prompt = `Stadium crowd data right now:\n${crowdData.map(g => `${g.gate}: ${g.current}% capacity, ${g.inflow} fans/min inflow`).join('\n')}\nProvide operational recommendations.`
    try {
      const response = await chatWithGemini([{ role: 'user', content: prompt }], 'crowdOps', 'en')
      setAiAlerts(prev => [{
        id: Date.now(),
        level: 'warning',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gate: null,
      }, ...prev.slice(0, 4)])
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateAnnouncement = async () => {
    if (!selectedGate) return
    setIsAnalyzing(true)
    const gate = crowdData.find(g => g.gate === selectedGate)
    const prompt = `Generate a calm, clear public address announcement in 3 languages (English, Spanish, French) for: ${gate?.gate} is at ${gate?.current}% capacity. Please redirect fans to available gates. Keep each version under 2 sentences.`
    try {
      const response = await chatWithGemini([{ role: 'user', content: prompt }], 'crowdOps', 'en')
      setAnnouncementText(response)
      setShowAnnounce(true)
    } catch (_e) {
      setAnnouncementText(`Attention please: ${selectedGate} is currently at high capacity. Please proceed to nearest available gate. Thank you.`)
      setShowAnnounce(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="danger"><span className="w-1.5 h-1.5 rounded-full bg-white mr-1" />LIVE</Badge>
          <Badge variant="primary">Operations Command</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">CrowdOps Dashboard</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">Real-time crowd intelligence for MetLife Stadium</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Left: Heatmap + Gates */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LuMap  className="w-5 h-5 text-brand-primary"  /> Stadium Heat Map
              </h2>
              <Badge variant="danger" className="bg-red-500/20 text-red-400 border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1" /> Real-time
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 text-[0.65rem] font-medium text-slate-900/60 dark:text-white/60">
              {[['bg-emerald-900/50', '< 40%'], ['bg-emerald-600', '40-60%'], ['bg-emerald-400', '60-75%'], ['bg-amber-400', '75-85%'], ['bg-orange-500', '85-95%'], ['bg-red-500', '> 95% ⚠️']].map(([cls, lbl]) => (
                <div key={cls} className="flex items-center gap-1.5">
                  <div className={cn("w-3.5 h-3.5 rounded-sm", cls)} /> {lbl}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-1.5 bg-black/20 p-2 rounded-xl border border-slate-300 dark:border-white/5">
              {SECTION_GRID.flat().map((cell, i) => (
                cell.startsWith('—') ? (
                  <div key={i} className="h-10 rounded bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-[0.65rem] text-slate-900/40 dark:text-white/40">
                    {cell === '—PITCH—' && '⚽'}
                  </div>
                ) : (
                  <div
                    key={i}
                    title={`Section ${cell}: ${SECTION_DENSITY[cell]}%`}
                    className={cn(
                      "h-10 rounded flex items-center justify-center text-[0.65rem] font-bold text-slate-900 dark:text-white transition-colors duration-1000",
                      densityClass(SECTION_DENSITY[cell])
                    )}
                  >
                    {cell}
                  </div>
                )
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <LuNavigation  className="w-5 h-5 text-slate-900/60 dark:text-white/60"  /> Gate Status
            </h2>
            <div className="flex flex-col gap-3">
              {crowdData.map((g) => {
                const isHigh = g.current >= 90
                const isMed  = g.current >= 75
                return (
                  <div
                    key={g.gate}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all",
                      selectedGate === g.gate ? "border-brand-primary bg-brand-primary/10 shadow-glow-primary" : "border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10"
                    )}
                    onClick={() => setSelectedGate(g.gate)}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0", isHigh ? 'bg-red-500/20' : isMed ? 'bg-amber-500/20' : 'bg-emerald-500/20')}>🚪</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">{g.gate}</div>
                      <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", isHigh ? "bg-red-500" : isMed ? "bg-amber-400" : "bg-emerald-400")}
                          style={{ width: `${g.current}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0 min-w-[60px]">
                      <div className={cn("font-bold text-lg", isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-emerald-400')}>{g.current}%</div>
                      <Badge variant={isHigh ? 'danger' : isMed ? 'warning' : 'success'} className="mt-1">{isHigh ? 'CRITICAL' : isMed ? 'HIGH' : 'OK'}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right: AI Alerts & Actions */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LuZap  className="w-5 h-5 text-brand-primary"  /> AI Operational Alerts
              </h2>
              <Button size="sm" onClick={analyzeWithAI} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? '⏳ Analyzing...' : <><LuActivity  className="w-4 h-4"  /> Analyze Now</>}
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {aiAlerts.map((a) => (
                <div key={a.id} className={cn("alert", a.level)}>
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">{a.level} — {a.time}</div>
                    <div className="text-sm text-slate-900/90 dark:text-white/90 whitespace-pre-wrap leading-relaxed">{a.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <LuMegaphone  className="w-5 h-5 text-purple-400"  /> AI PA Announcement Generator
            </h2>
            <p className="text-xs text-slate-900/50 dark:text-white/50 mb-4">Select a gate to generate a multilingual public address announcement instantly.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedGate} onValueChange={setSelectedGate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select gate..." />
                </SelectTrigger>
                <SelectContent>
                  {crowdData.map(g => <SelectItem key={g.gate} value={g.gate}>{g.gate} — {g.current}%</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={generateAnnouncement} disabled={!selectedGate || isAnalyzing} className="w-full sm:w-auto shrink-0 gap-2">
                <LuMegaphone  className="w-4 h-4"  /> Generate
              </Button>
            </div>

            {showAnnounce && announcementText && (
              <div className="mt-4 p-4 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl animate-fade-in">
                <div className="text-[0.65rem] font-bold text-brand-primary mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <LuZap  className="w-3 h-3"  /> Multilingual PA Announcement
                </div>
                <div className="text-sm text-slate-900/90 dark:text-white/90 whitespace-pre-wrap leading-relaxed mb-4">{announcementText}</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => alert('📢 Broadcasting to all stadium speakers...')} className="flex-1 gap-2">
                    <LuMegaphone  className="w-4 h-4"  /> Broadcast
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowAnnounce(false)}>Dismiss</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LuActivity  className="w-4 h-4 text-cyan-400"  /> Surge Predictions
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { gate: 'Gate C', time: '11 min', risk: 'HIGH',    action: 'Open Gate D overflow', color: 'danger' },
                { gate: 'Section 120', time: '18 min', risk: 'MED', action: 'Pre-position 3 stewards', color: 'warning' },
                { gate: 'Concourse B', time: '~HT',   risk: 'HIGH', action: 'Increase concession staff by 40%', color: 'danger' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/5">
                  <div>
                    <div className="font-semibold text-sm text-slate-900/90 dark:text-white/90">{p.gate}</div>
                    <div className="text-xs text-slate-900/50 dark:text-white/50 mt-0.5">Predicted in {p.time} · <span className="text-slate-900/70 dark:text-white/70">{p.action}</span></div>
                  </div>
                  <Badge variant={p.color}>{p.risk}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
