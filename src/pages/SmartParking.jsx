import { useState } from 'react'
import { STADIUM_PARKING_GRAPH, findOptimalParking, generateParkingDirections } from '@/utils/gemini'
import QRCode from 'qrcode'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { LuCircle, LuTicket, LuCar, LuMapPin, LuNavigation, LuArrowDownToLine, LuZap } from 'react-icons/lu';

const ALL_MATCHES = [
  { id: 'm1', label: 'USA vs England — Jul 4, 2026, 19:00 EST', stadium: 'MetLife Stadium, NJ' },
  { id: 'm2', label: 'Brazil vs France — Jul 7, 2026, 20:00 EST', stadium: 'MetLife Stadium, NJ' },
  { id: 'm3', label: 'Argentina vs Spain — Jul 10, 2026, 18:00 EST', stadium: 'MetLife Stadium, NJ' },
  { id: 'F1', label: 'Final: Arsenal vs Man City — Jul 19, 2026, 20:00 EST', stadium: 'Emirates Stadium' }
]

const ENTRY_GATES = ['A', 'B']
const VEHICLE_TYPES = ['Standard', 'Accessible (Wheelchair)', 'EV / Hybrid', 'Motorcycle']

import { useAuth } from '@/context/AuthContext'

export default function SmartParking({ ctx }) {
  const { profile } = useAuth()
  const graph = STADIUM_PARKING_GRAPH

  const [step, setStep] = useState(1) // 1: form, 2: result, 3: qr
  const [form, setForm] = useState({
    name: '', email: '', phone: '', vehicleReg: '',
    matchId: '', entryGate: 'A', vehicleType: 'Standard',
    fanStatus: 'Ticket Holder', ticketNumber: '',
    needsAccessible: false, needsEV: false,
  })
  const [result, setResult] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const nodes = graph.nodes

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'vehicleType') {
        next.needsAccessible = value.includes('Accessible')
        next.needsEV = value.includes('EV')
      }
      if (field === 'matchId' && next.fanStatus === 'Ticket Holder' && profile?.tickets) {
        // Auto-fill ticket number when match is selected
        const tkt = profile.tickets.find(t => next.matchId === t.match)
        if (tkt) next.ticketNumber = tkt.code
      }
      if (field === 'fanStatus') {
        if (value === 'Ticket Holder') {
          // Reset match selection so it can be filtered
          next.matchId = ''
          next.ticketNumber = ''
        } else {
          // Default to first match if no ticket
          next.matchId = ALL_MATCHES[0].id
        }
      }
      return next
    })
  }

  const handleBook = async () => {
    if (!form.vehicleReg || !form.email) {
      alert('Please fill in your vehicle registration and email.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 800))

    const bestZoneId = findOptimalParking(graph, form.entryGate, {
      needsAccessible: form.needsAccessible,
      needsEV: form.needsEV,
    })

    if (!bestZoneId) {
      alert('No available parking slots matching your requirements. Please try a different entry gate.')
      setLoading(false)
      return
    }

    // We use the ID or the exact Match Name to find the stadium
    let match = ALL_MATCHES.find(m => m.id === form.matchId || m.label.includes(form.matchId))
    if (!match && profile?.tickets) {
      const userTicket = profile.tickets.find(t => t.match === form.matchId)
      if (userTicket) {
        match = { id: userTicket.match, label: `${userTicket.match} — ${userTicket.date}, ${userTicket.time}`, stadium: 'MetLife Stadium, NJ' }
      }
    }

    if (form.fanStatus === 'Fan Zone (No Ticket)') {
      // Put them in a waitlist queue
      setResult({
        bookingId: `WC26-WL-${Date.now().toString(36).toUpperCase()}`,
        status: 'WAITLIST',
        fanName: form.name || 'Fan',
        email: form.email,
        vehicleReg: form.vehicleReg.toUpperCase(),
        matchLabel: match?.label,
        message: 'Your parking request is on the waitlist. Priority is given to ticket holders. You will be notified via email if a slot becomes available due to no-shows.'
      })
      setStep(2)
      setLoading(false)
      return
    }

    if (form.fanStatus === 'Ticket Holder' && !form.ticketNumber) {
      alert('Please enter your Match Ticket Number to reserve priority parking.')
      setLoading(false)
      return
    }

    const zone = nodes[bestZoneId]
    const slotNumber = zone.occupied + 1
    const slotId = `${bestZoneId.replace('ZONE_', '')}-${String(slotNumber).padStart(2, '0')}`
    const bookingId = `WC26-PKG-${Date.now().toString(36).toUpperCase()}`
    const directions = generateParkingDirections(bestZoneId, form.entryGate, graph)

    const booking = {
      bookingId,
      fanName: form.name || 'Fan',
      email: form.email,
      vehicleReg: form.vehicleReg.toUpperCase(),
      ticketNumber: form.ticketNumber,
      matchId: form.matchId,
      matchLabel: match?.label,
      status: 'CONFIRMED',
      stadium: match?.stadium,
      zoneId: bestZoneId,
      zoneName: zone.label,
      slotId,
      floor: zone.floor,
      entryGate: `Gate ${form.entryGate}`,
      accessible: zone.accessible,
      ev: zone.ev,
      directions,
      bookedAt: new Date().toISOString(),
    }

    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      vehicleReg: booking.vehicleReg,
      slotId: booking.slotId,
      gate: booking.entryGate,
      match: booking.matchId,
    })

    try {
      const url = await QRCode.toDataURL(qrPayload, {
        width: 200, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch (e) { console.error('QR error:', e) }

    setResult(booking)
    setStep(2)
    setLoading(false)
  }

  const zones = Object.entries(nodes).filter(([, n]) => n.type === 'zone')
  const totalSlots = zones.reduce((s, [, n]) => s + n.capacity, 0)
  const totalOccupied = zones.reduce((s, [, n]) => s + n.occupied, 0)
  const availableSlots = totalSlots - totalOccupied

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="primary"><LuCircle  className="w-3 h-3 mr-1"  /> Smart Parking</Badge>
          <Badge variant="success">AI-Powered Allocation</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Smart Parking System</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">AI-optimised slot allocation with graph-based pathfinding. QR booking in seconds.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex flex-col gap-1 border-brand-primary/20 bg-brand-primary/5">
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{availableSlots}</div>
          <div className="text-xs text-slate-900/60 dark:text-white/60 font-semibold uppercase tracking-wider">Available Slots</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-cyan-500/20 bg-cyan-500/5">
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{zones.filter(([, n]) => n.accessible && n.occupied < n.capacity).length}</div>
          <div className="text-xs text-slate-900/60 dark:text-white/60 font-semibold uppercase tracking-wider">Accessible Zones Free</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{zones.filter(([, n]) => n.ev && n.occupied < n.capacity).length}</div>
          <div className="text-xs text-slate-900/60 dark:text-white/60 font-semibold uppercase tracking-wider">EV Zones Free</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{Math.max(...zones.map(([, n]) => n.floor)) + 1}</div>
          <div className="text-xs text-slate-900/60 dark:text-white/60 font-semibold uppercase tracking-wider">Parking Floors</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Forms / Results */}
        <div className="flex flex-col gap-4">
          {step === 1 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <LuTicket  className="w-5 h-5 text-brand-primary"  /> Book Your Slot
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Full Name</label>
                  <input className="input-field" placeholder="Your name" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Email *</label>
                    <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Phone</label>
                    <input className="input-field" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Vehicle Reg Number *</label>
                  <input className="input-field uppercase" placeholder="e.g. ABC1234" value={form.vehicleReg} onChange={e => handleChange('vehicleReg', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Fan Status</label>
                    <Select value={form.fanStatus} onValueChange={v => handleChange('fanStatus', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ticket Holder">Ticket Holder</SelectItem>
                        <SelectItem value="Fan Zone (No Ticket)">Fan Zone (No Ticket)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.fanStatus === 'Ticket Holder' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Ticket Number *</label>
                      <input className="input-field uppercase" placeholder="e.g. TKT-1234" value={form.ticketNumber} onChange={e => handleChange('ticketNumber', e.target.value)} required />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Match</label>
                  <Select value={form.matchId} onValueChange={v => handleChange('matchId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Match" /></SelectTrigger>
                    <SelectContent>
                      {form.fanStatus === 'Ticket Holder' && profile?.tickets?.length > 0
                        ? profile.tickets.map(tkt => (
                            <SelectItem key={tkt.match} value={tkt.match}>
                              {tkt.match} — {tkt.date}
                            </SelectItem>
                          ))
                        : ALL_MATCHES.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  {form.fanStatus === 'Ticket Holder' && (!profile?.tickets || profile.tickets.length === 0) && (
                    <div className="text-xs text-red-500 mt-1">You have no tickets on this account. Purchase a ticket in the portal first!</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Entry Gate</label>
                    <Select value={form.entryGate} onValueChange={v => handleChange('entryGate', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENTRY_GATES.map(g => <SelectItem key={g} value={g}>Gate {g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Vehicle Type</label>
                    <Select value={form.vehicleType} onValueChange={v => handleChange('vehicleType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.needsAccessible && (
                  <div className="alert info mt-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1">♿ Accessible Parking</div>
                      <div className="text-sm">AI will prioritise accessible zones closest to Gate {form.entryGate}.</div>
                    </div>
                  </div>
                )}

                <Button className="w-full mt-4" size="lg" onClick={handleBook} disabled={loading}>
                  {loading ? '⏳ AI Allocating Optimal Slot...' : '🤖 Book with AI Allocation'}
                </Button>
              </div>
            </Card>
          )}

          {(step === 2 || step === 3) && result && (
            <Card className="p-6 animate-fade-in">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-300 dark:border-white/10">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <LuCircle  className="w-6 h-6"  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {result.status === 'WAITLIST' ? 'Waitlist Joined' : 'Booking Confirmed'}
                  </h2>
                  <p className="text-xs text-slate-900/50 dark:text-white/50 font-mono mt-0.5">ID: {result.bookingId}</p>
                </div>
                {result.status === 'WAITLIST' ? (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/50">WAITLISTED</Badge>
                ) : (
                  <Badge variant="success">CONFIRMED</Badge>
                )}
              </div>

              {result.status === 'WAITLIST' ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-900/80 dark:text-white/80 leading-relaxed">{result.message}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: () => <LuCar />, label: 'Vehicle', value: result.vehicleReg },
                  { icon: () => <LuTicket />, label: 'Match', value: result.matchLabel?.split('—')[0] },
                  { icon: () => <LuMapPin />, label: 'Zone & Slot', value: `${result.zoneName} · Slot ${result.slotId}` },
                  { icon: () => <LuMapPin />, label: 'Entry Gate', value: result.entryGate },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-300 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-slate-900/60 dark:text-white/60">
                      <item.icon className="w-4 h-4" /> {item.label}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  {result.accessible && <Badge variant="primary">♿ Accessible Required</Badge>}
                  {result.ev && <Badge variant="success">⚡ EV Charging</Badge>}
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-2">
                    <LuNavigation  className="w-4 h-4"  /> AI Navigation Directions
                  </div>
                  <p className="text-sm text-slate-900/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">{result.directions}</p>
                </div>
                </>
              )}

              <div className="flex gap-3">
                {result.status === 'CONFIRMED' && (
                  <Button className="flex-1" onClick={() => setStep(3)}>📱 View QR Pass</Button>
                )}
                <Button variant="secondary" className="flex-1" onClick={() => { setStep(1); setResult(null); setQrDataUrl('') }}>Book Another</Button>
              </div>
            </Card>
          )}

          {step === 3 && qrDataUrl && (
            <Card className="p-8 flex flex-col items-center gap-6 animate-slide-up text-center border-brand-primary/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your Parking QR Pass</h3>
                <p className="text-xs text-slate-900/50 dark:text-white/50">Show this code at {result?.entryGate}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-glow-primary">
                <img src={qrDataUrl} alt="QR" className="w-48 h-48" />
              </div>
              <div className="font-mono text-sm font-bold tracking-widest text-slate-900/80 dark:text-white/80 bg-slate-200 dark:bg-white/5 px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10">
                {result?.slotId}
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => {
                const a = document.createElement('a'); a.href = qrDataUrl; a.download = `Parking-${result?.slotId}.png`; a.click()
              }}>
                <LuArrowDownToLine  className="w-4 h-4"  /> Download Pass
              </Button>
            </Card>
          )}
        </div>

        {/* Right: Map & Explainer */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LuMapPin className="w-4 h-4 text-slate-900/60 dark:text-white/60" /> Parking Zone Map
            </h2>
            <div className="flex flex-wrap gap-3 mb-4 text-[0.65rem] font-medium text-slate-900/60 dark:text-white/60">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" /> Available</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/40" /> Full</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500/40" /> Accessible ♿</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" /> EV ⚡</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {zones.map(([id, zone]) => {
                const isFull = zone.occupied >= zone.capacity
                const isSelected = result?.zoneId === id
                const avail = zone.capacity - zone.occupied
                return (
                  <div key={id} className={cn(
                    'parking-slot flex flex-col items-center justify-center gap-1 min-h-[70px]',
                    isSelected ? 'ring-2 ring-white bg-brand-primary/20 border-brand-primary shadow-glow-primary scale-[1.02]' :
                    isFull ? 'full' : zone.accessible ? 'accessible' : zone.ev ? 'ev' : ''
                  )}>
                    <div className="font-bold text-sm text-slate-900/90 dark:text-white/90">{zone.label.replace('Zone ', '')}</div>
                    <div className="text-[0.6rem] font-medium opacity-80 flex flex-wrap justify-center gap-1">
                      {isFull ? 'FULL' : `${avail} free`}
                      {zone.accessible && '♿'}
                      {zone.ev && '⚡'}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-card">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <LuZap  className="w-4 h-4 text-brand-primary"  /> How AI Allocation Works
            </h3>
            <div className="text-xs text-slate-900/60 dark:text-white/60 leading-relaxed space-y-2">
              <p>StadiumIQ uses a <strong className="text-brand-primary">weighted Dijkstra graph algorithm</strong> to find your optimal slot:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Parking zones are <strong>graph nodes</strong>, lanes are <strong>weighted edges</strong>.</li>
                <li>Weights consider distance from gate, occupancy level, accessibility, and floor preference.</li>
                <li>Wheelchair users get a <strong>70% weight reduction</strong> on accessible zones.</li>
                <li>Nearly-full zones ({'>'}85%) get a <strong>2× penalty</strong> to spread load.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
