import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/utils/firebase'
import { Button } from '@/components/ui/button'
import { LuTicket, LuCrown, LuCircleCheck } from 'react-icons/lu'
import { cn } from '@/lib/utils'

const MATCHES = [
  { id: 'm1', name: 'USA vs England', date: 'Jul 4, 2026', time: '19:00 EST' },
  { id: 'm2', name: 'Brazil vs France', date: 'Jul 7, 2026', time: '20:00 EST' },
  { id: 'm3', name: 'Argentina vs Spain', date: 'Jul 10, 2026', time: '18:00 EST' }
]

export default function TicketPortal() {
  const { user, profile, refreshProfile, isConfigured } = useAuth()
  const navigate = useNavigate()

  const [selectedMatch, setSelectedMatch] = useState(null)
  const [selectedTier, setSelectedTier] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePurchase = async () => {
    if (!selectedMatch || !selectedTier) return
    setPurchasing(true)
    try {
      const ticketCode = `${selectedTier === 'premium' ? 'VIP' : 'STD'}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      const ticketData = {
        code: ticketCode,
        type: selectedTier,
        match: selectedMatch.name,
        date: selectedMatch.date,
        time: selectedMatch.time,
        seat: selectedTier === 'premium' ? 'Section A, Row 1, Seat 12' : 'Section F, Row 32, Seat 105'
      }

      if (isConfigured && user) {
        const ref = doc(db, 'users', user.uid)
        await updateDoc(ref, { tickets: arrayUnion(ticketData) })
        await refreshProfile()
      } else {
        // Mock for demo mode
        profile.tickets = profile.tickets || []
        profile.tickets.push(ticketData)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (err) {
      console.error(err)
      alert("Error generating ticket.")
      setPurchasing(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in text-center p-6">
        <LuCircleCheck className="w-20 h-20 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Ticket Confirmed!</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Your digital ticket has been linked to your account. Redirecting you to the stadium experience...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Get Your Tickets</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Book your spot for the FIFA World Cup 2026 matches.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Step 1: Matches */}
        <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs">1</span>
            Select Match
          </h2>
          
          <div className="flex flex-col gap-3 mt-2">
            {MATCHES.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200",
                  selectedMatch?.id === match.id 
                    ? "border-brand-primary bg-brand-primary/10 shadow-glow-primary" 
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="font-bold">{match.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{match.date} • {match.time}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Tier */}
        <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs">2</span>
            Select Tier
          </h2>

          <div className="flex flex-col gap-4 mt-2">
            {/* Standard Tier */}
            <button
              onClick={() => setSelectedTier('standard')}
              className={cn(
                "p-5 rounded-xl border text-left transition-all duration-200 relative overflow-hidden",
                selectedTier === 'standard'
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <LuTicket className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-lg">Standard Pass</span>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 ml-8">
                <li>• General Admission Seating</li>
                <li>• Access to Standard Amenities</li>
                <li>• Fan Dashboard Access</li>
              </ul>
            </button>

            {/* Premium Tier */}
            <button
              onClick={() => setSelectedTier('premium')}
              className={cn(
                "p-5 rounded-xl border text-left transition-all duration-200 relative overflow-hidden",
                selectedTier === 'premium'
                  ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5"
              )}
            >
              {/* Gold gradient background effect when selected */}
              {selectedTier === 'premium' && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
              )}
              
              <div className="flex items-center gap-3 mb-2">
                <LuCrown className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">VIP Premium Pass</span>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 ml-8">
                <li><strong className="text-slate-700 dark:text-slate-200">• Premium Front Row Booths</strong></li>
                <li><strong className="text-slate-700 dark:text-slate-200">• Exclusive Signed Merchandise</strong></li>
                <li><strong className="text-slate-700 dark:text-slate-200">• Team Meet & Greet Access</strong></li>
                <li><strong className="text-slate-700 dark:text-slate-200">• VIP Shuttle Routing</strong></li>
              </ul>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Button 
          size="lg" 
          onClick={handlePurchase} 
          disabled={!selectedMatch || !selectedTier || purchasing}
          className="w-full md:w-auto px-12"
        >
          {purchasing ? 'Generating Ticket...' : 'Complete Purchase (Mock)'}
        </Button>
      </div>
    </div>
  )
}
