import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// lucide-react removed
import { IconContext } from 'react-icons';
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { useSyncQueue } from '@/hooks/useSyncQueue'

import { LuHardHat, LuQrCode, LuRefreshCw, LuUsers, LuPhone, LuShieldCheck } from 'react-icons/lu';

export default function VolunteerManagement() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'
  const isVolunteer = profile?.role === 'volunteer'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [zone, setZone] = useState('Zone A')
  const [seats, setSeats] = useState('')
  
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [registered, setRegistered] = useState(false)

  const [volunteers, setVolunteers] = useState([
    { id: 1, name: 'Kenji T.', phone: '555-0101', zone: 'Zone B', seats: 'Sec 110' },
    { id: 2, name: 'Maria S.', phone: '555-0102', zone: 'Zone A', seats: 'Sec 102' }
  ])

  // Initialize the sync queue for 'scans' collection
  const { enqueue, syncNow, isSyncing, queueLength } = useSyncQueue('scans')

  const handleDelete = (id) => {
    setVolunteers(prev => prev.filter(v => v.id !== id))
  }

  const handleSendOTP = (e) => {
    e.preventDefault()
    if (!phone) return
    setOtpSent(true)
    // [Cloud Function Mock] Sending OTP to ${phone} via TextLocal API
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    if (otp.length === 6) {
      setRegistered(true)
      // [Firestore Mock] Registered volunteer ${name} in ${zone} for seats ${seats}
      setVolunteers(prev => [...prev, { id: Date.now(), name, phone, zone, seats }])
    } else {
      alert('Invalid OTP. Use a 6-digit code.')
    }
  }

  const handleSimulateScan = () => {
    const mockSection = Math.floor(Math.random() * (130 - 100) + 100).toString()
    const mockGate = zone.split(' ')[1] || 'A'
    
    // Add to the local sync queue
    enqueue({
      section: mockSection,
      gate: mockGate,
      scannedBy: profile?.name || name || 'Volunteer',
      ticketId: `TKT-${Math.floor(Math.random() * 10000)}`
    })
  }

  if (isVolunteer || registered) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="success">Active Duty</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Volunteer Dashboard</h1>
          <p className="text-sm text-slate-900/50 dark:text-white/50">Your assigned zone and crowd control duties.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LuHardHat  className="w-5 h-5 text-brand-primary"  /> Your Assignment
            </h2>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl">
                <div className="text-xs text-slate-900/50 dark:text-white/50 uppercase tracking-wider mb-1">Zone</div>
                <div className="text-xl font-bold text-brand-primary">{zone || 'Zone A'}</div>
              </div>
              <div className="p-4 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl">
                <div className="text-xs text-slate-900/50 dark:text-white/50 uppercase tracking-wider mb-1">Assigned Seat Range</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{seats || 'Section 102, Rows A-F'}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <LuQrCode  className="w-16 h-16 text-slate-900/20 dark:text-white/20 mb-4"  />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Scan Fan Ticket</h2>
            <p className="text-sm text-slate-900/60 dark:text-white/60 mb-6">Scan QR codes to update live occupancy heatmap in CrowdOps and direct fans to their exact seats.</p>
            <Button size="lg" className="w-full gap-2 mb-4" onClick={handleSimulateScan}>
              <LuQrCode  className="w-5 h-5"  /> Simulate Scan
            </Button>
            
            {/* Sync Queue Status */}
            <div className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Offline Queue</span>
                <span className="text-xs text-slate-900/60 dark:text-white/60">
                  {queueLength} scans pending
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncNow} 
                disabled={queueLength === 0 || isSyncing}
                className="gap-2 text-xs h-8"
              >
                <LuRefreshCw  className={cn("w-3 h-3", isSyncing && "animate-spin")}  />
                Sync Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (isAdmin && !registered) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="warning">?? Admin Control</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Volunteer Management</h1>
          <p className="text-sm text-slate-900/50 dark:text-white/50">Register volunteers and assign zones via OTP verification.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LuUsers  className="w-5 h-5 text-brand-primary"  /> Register Volunteer
            </h2>
            
            <form className="flex flex-col gap-4" onSubmit={!otpSent ? handleSendOTP : handleVerifyOTP}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Full Name</label>
                <input required className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={otpSent} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Phone Number (For OTP via TextLocal)</label>
                <div className="flex items-center bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl overflow-hidden">
                  <div className="px-3 text-slate-900/50 dark:text-white/50 bg-black/20 border-r border-slate-300 dark:border-white/10">+1</div>
                  <input required type="tel" className="flex-1 bg-transparent border-none px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none" placeholder="555-0123" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Zone</label>
                  <Select value={zone} onValueChange={setZone} disabled={otpSent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zone A">Zone A</SelectItem>
                      <SelectItem value="Zone B">Zone B</SelectItem>
                      <SelectItem value="Zone C">Zone C</SelectItem>
                      <SelectItem value="Zone D">Zone D (Accessible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-900/60 dark:text-white/60">Seat Range</label>
                  <input required className="input-field" placeholder="Sec 102, A-F" value={seats} onChange={e => setSeats(e.target.value)} disabled={otpSent} />
                </div>
              </div>

              {!otpSent ? (
                <Button type="submit" className="mt-2 gap-2 w-full">
                  <LuPhone  className="w-4 h-4"  /> Send OTP
                </Button>
              ) : (
                <div className="mt-4 p-4 border border-brand-primary/50 bg-brand-primary/10 rounded-xl animate-fade-in flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-brand-primary">
                    <LuShieldCheck  className="w-4 h-4"  /> Enter Verification Code
                  </div>
                  <input required className="input-field tracking-widest font-mono text-center text-lg" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                  <Button type="submit" className="w-full">Verify & Assign</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOtpSent(false)} className="text-xs">Change Phone Number</Button>
                </div>
              )}
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Algorithm: Seat Lookup</h2>
            <div className="text-sm text-slate-900/60 dark:text-white/60 mb-4 leading-relaxed">
              When a fan scans their ticket in the FanAssist app, or a volunteer scans a ticket here, the system uses a spatial mapping algorithm to resolve the closest available volunteer to the fan's section, passing the location data to Firebase to live-update the CrowdOps heatmap.
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-slate-300 dark:border-white/5 font-mono text-xs text-slate-900/50 dark:text-white/50 whitespace-pre-wrap">
{`function resolveVolunteerForSeat(section) {
  // O(1) hash map lookup for fast resolution
  const seatMap = {
    '102': 'Zone A (Maria S.)',
    '110': 'Zone B (Kenji T.)',
    // ...
  };
  return seatMap[section] || 'General Staff';
}`}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <LuUsers  className="w-5 h-5 text-brand-primary"  /> Active Volunteers
          </h2>
          <div className="space-y-2">
            {volunteers.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{v.name}</div>
                  <div className="text-xs text-slate-900/50 dark:text-white/50">{v.zone} · {v.seats} · {v.phone}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Remove</Button>
              </div>
            ))}
            {volunteers.length === 0 && <div className="text-sm text-slate-900/50 dark:text-white/50 p-4 text-center">No active volunteers.</div>}
          </div>
        </Card>
      </div>
    )
  }

  // Not admin, not registered, not volunteer
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <LuHardHat  className="w-12 h-12 text-slate-900/20 dark:text-white/20 mb-4"  />
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
      <p className="text-sm text-slate-900/50 dark:text-white/50">You do not have permission to view Volunteer Management.</p>
    </div>
  )
}
