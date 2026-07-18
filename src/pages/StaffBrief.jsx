import { useState } from 'react'
import { chatWithGemini, speakText } from '@/utils/gemini'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// lucide-react removed
import { IconContext } from 'react-icons';
import { cn } from '@/lib/utils'

import { LuHardHat, LuZap, LuClipboardList, LuVolume2, LuBookOpen, LuMessageSquare, LuSend, LuUsers, LuRadio } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const VOLUNTEERS = [
  { id: 1, name: 'Maria S.',  zone: 'Zone A', role: 'Gate Steward',   status: 'active',  lang: '🇧🇷', section: 'Gate A Entrance' },
  { id: 2, name: 'Kenji T.',  zone: 'Zone B', role: 'First Aid',      status: 'active',  lang: '🇯🇵', section: 'Section 110' },
  { id: 3, name: 'Ahmed K.',  zone: 'Zone C', role: 'Crowd Control',  status: 'busy',    lang: '🇸🇦', section: 'Gate C' },
  { id: 4, name: 'Sophie L.', zone: 'Zone D', role: 'Accessibility Assist', status: 'active', lang: '🇫🇷', section: 'Gate D Lift Area' },
  { id: 5, name: 'Carlos M.', zone: 'Zone A', role: 'Info Desk',      status: 'active',  lang: '🇲🇽', section: 'Main Concourse' },
  { id: 6, name: 'Park J.',   zone: 'Zone B', role: 'Parking Staff',  status: 'offline', lang: '🇰🇷', section: 'Zone B2' },
]

const QUICK_SOPS = [
  'Lost child procedure?',
  'Medical emergency steps?',
  'Fire evacuation protocol?',
  'Crowd crush prevention?',
  'Gate overflow management?',
  'Wheelchair assistance?',
]

export default function StaffBrief({ ctx }) {
  const { language, audioMode } = ctx
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(String(VOLUNTEERS[0].id))
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const generateBriefing = async () => {
    setLoadingBriefing(true)
    const v = VOLUNTEERS.find(vol => String(vol.id) === selectedVolunteerId)
    const prompt = `Generate a shift briefing for a FIFA World Cup 2026 volunteer. Name: ${v.name}, Zone: ${v.zone}, Role: ${v.role}, Section: ${v.section}. Current match: Brazil vs Germany, 67 min, score 2-1. Crowd at 94% capacity. Gate C critical. Include: location, key responsibilities today, current crowd alerts, nearest medical station, emergency contacts, and one motivational note. Keep it concise and practical. Respond in ${language === 'ja' ? 'Japanese' : language === 'ar' ? 'Arabic' : language === 'ko' ? 'Korean' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'}.`
    try {
      const resp = await chatWithGemini([{ role: 'user', content: prompt }], 'staffBrief', language)
      setBriefing(resp)
      if (audioMode) speakText(resp, language)
    } catch (e) {
      setBriefing(`**Shift Briefing — ${v.name} | ${v.zone} | ${v.role}**\n\nReport to your zone by 20:30. Crowd at 94% capacity — be extra vigilant. Gate C is critical. Medical station 50m east. Radio Channel 3 for emergencies. You're doing great — thank you for making FIFA 2026 unforgettable! 🌍⚽`)
    } finally {
      setLoadingBriefing(false)
    }
  }

  const askSOP = async (question = input) => {
    if (!question.trim() || isLoading) return
    const userMsg = { id: Date.now(), role: 'user', content: question, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    try {
      const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const resp = await chatWithGemini(allMsgs, 'staffBrief', language)
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: resp, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, aiMsg])
      if (audioMode) speakText(resp, language)
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Could not load SOP. Please check the physical manual or contact your supervisor on radio Channel 3.', time: '' }])
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = filterStatus === 'all' ? VOLUNTEERS : VOLUNTEERS.filter(v => v.status === filterStatus)

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="purple"><LuHardHat  className="w-3 h-3 mr-1"  /> Staff Only</Badge>
          <Badge variant="primary"><LuZap  className="w-3 h-3 mr-1"  /> AI-Powered</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">StaffBrief</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">AI briefings, SOP lookup, and volunteer coordination for FIFA 2026 staff</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Left: Briefing & SOP */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LuClipboardList  className="w-5 h-5 text-brand-primary"  /> Generate Shift Briefing
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Select Volunteer</label>
                <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLUNTEERS.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        <span className="flex items-center gap-2">
                          <span>{v.lang}</span>
                          <span className="font-semibold">{v.name}</span>
                          <span className="text-slate-900/40 dark:text-white/40 text-xs">— {v.role} ({v.zone})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateBriefing} disabled={loadingBriefing} className="w-full gap-2">
                {loadingBriefing ? '⏳ Generating...' : <><LuClipboardList  className="w-4 h-4"  /> Generate AI Briefing</>}
              </Button>
            </div>

            {briefing && (
              <div className="mt-4 p-4 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[0.65rem] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <LuZap  className="w-3 h-3"  /> AI Shift Briefing
                  </div>
                  {audioMode && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => speakText(briefing, language)}>
                      <LuVolume2  className="w-3.5 h-3.5"  /> Read
                    </Button>
                  )}
                </div>
                <div className="text-sm text-slate-900/90 dark:text-white/90 whitespace-pre-wrap leading-relaxed">{briefing}</div>
              </div>
            )}
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-300 dark:border-white/10 flex items-center gap-2">
              <LuBookOpen  className="w-5 h-5 text-purple-400"  />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">SOP Quick Lookup</h2>
            </div>
            
            <div className="p-4 border-b border-slate-300 dark:border-white/10 flex flex-wrap gap-2 bg-slate-200 dark:bg-white/5">
              {QUICK_SOPS.map(q => (
                <Button key={q} variant="secondary" size="sm" onClick={() => askSOP(q)} disabled={isLoading} className="text-xs h-7">
                  {q}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin bg-black/20">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
                  <LuMessageSquare  className="w-10 h-10 mb-3 text-slate-900/40 dark:text-white/40"  />
                  <div className="font-semibold text-slate-900 dark:text-white">Ask any SOP question</div>
                  <div className="text-xs text-slate-900/60 dark:text-white/60 mt-1">Use the quick buttons above or type below</div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex gap-3 items-start', msg.role === 'user' && 'flex-row-reverse')}>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-slate-300 dark:border-white/10', msg.role === 'assistant' ? 'bg-brand-primary/20 text-brand-primary text-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white')}>
                    {msg.role === 'assistant' ? '📚' : '👷'}
                  </div>
                  <div className={cn('message-bubble', msg.role === 'user' ? 'user' : 'ai text-sm leading-relaxed')}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-sm">📚</div>
                  <div className="message-bubble ai">
                    <div className="typing-dots"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Ask about any procedure..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askSOP()}
              />
              <Button onClick={() => askSOP()} disabled={!input.trim() || isLoading} size="icon">
                <LuSend  className="w-4 h-4"  />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Volunteers & Emergency */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LuUsers  className="w-5 h-5 text-slate-900/60 dark:text-white/60"  /> Active Volunteers
              </h2>
              <div className="flex gap-1 bg-slate-200 dark:bg-white/5 p-1 rounded-lg border border-slate-300 dark:border-white/10">
                {['all', 'active', 'busy', 'offline'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-2.5 py-1 text-[0.65rem] font-bold rounded-md uppercase tracking-wider transition-colors",
                      filterStatus === s ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-900/40 dark:text-white/40 hover:text-slate-900/80 dark:hover:text-white/80"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {filtered.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
                  <div className="text-xl w-10 h-10 rounded-lg bg-black/20 border border-slate-300 dark:border-white/5 flex items-center justify-center shrink-0">
                    {v.lang}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{v.name}</div>
                    <div className="text-[0.65rem] text-slate-900/50 dark:text-white/50 truncate mt-0.5">{v.role} · {v.section}</div>
                    <div className="text-[0.65rem] text-slate-900/40 dark:text-white/40 truncate">{v.zone}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={v.status === 'active' ? 'success' : v.status === 'busy' ? 'warning' : 'outline'} className="text-[0.55rem] px-1.5 h-4 uppercase">
                      {v.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-900/50 dark:text-white/50 hover:text-brand-primary" onClick={() => alert(`Alerting ${v.name} via radio Channel 3...`)} title="Radio Contact">
                      <LuRadio  className="w-4 h-4"  />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-red-500/30 bg-red-500/5">
            <h2 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
              <FiAlertTriangle  className="w-4 h-4"  /> Emergency Contacts
            </h2>
            <div className="flex flex-col gap-2">
              {[
                ['🚑 Medical Emergency', 'Radio Ch. 1 | Staff ext. 911'],
                ['🔥 Fire', 'Radio Ch. 2 | Evacuate Zone'],
                ['👮 Security', 'Radio Ch. 3 | Gate A Control Room'],
                ['📍 Lost Child', 'Radio Ch. 3 | Gate A Security Post'],
                ['♿ Accessibility', 'Radio Ch. 4 | Gate D Desk'],
              ].map(([label, contact]) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-slate-200 dark:bg-white/5 border border-red-500/10">
                  <span className="font-semibold text-sm text-slate-900/90 dark:text-white/90">{label}</span>
                  <span className="text-xs font-mono text-red-300">{contact}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
