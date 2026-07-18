import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/utils/firebase'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { LuSend, LuTicket, LuCheck, LuX } from 'react-icons/lu'
import { motion, AnimatePresence } from 'framer-motion'

export default function TicketTransfer() {
  const { profile, user, refreshProfile, isConfigured } = useAuth()
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', msg: string }

  const tickets = profile?.tickets || []

  const handleTransfer = async () => {
    if (!recipientEmail || !selectedTicket) return
    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      setStatus({ type: 'error', msg: "You cannot transfer a ticket to yourself." })
      return
    }

    setTransferring(true)
    setStatus(null)

    try {
      if (isConfigured) {
        // Query users collection for recipient
        const q = query(collection(db, 'users'), where('email', '==', recipientEmail.toLowerCase()))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          setStatus({ type: 'error', msg: 'User not found. They must register an account first.' })
          setTransferring(false)
          return
        }

        const recipientDoc = querySnapshot.docs[0]
        const recipientRef = doc(db, 'users', recipientDoc.id)
        const senderRef = doc(db, 'users', user.uid)

        // Transfer transaction (we'll do sequential updates for simplicity)
        await updateDoc(recipientRef, {
          tickets: arrayUnion(selectedTicket)
        })
        
        await updateDoc(senderRef, {
          tickets: arrayRemove(selectedTicket)
        })

        await refreshProfile()
      } else {
        // Mock mode (simulated delay, then remove from local array)
        await new Promise(r => setTimeout(r, 1000))
        const idx = profile.tickets.findIndex(t => t.code === selectedTicket.code)
        if (idx > -1) {
          profile.tickets.splice(idx, 1)
        }
      }

      setStatus({ type: 'success', msg: `Ticket ${selectedTicket.code} successfully transferred to ${recipientEmail}!` })
      setRecipientEmail('')
      setSelectedTicket(null)
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', msg: 'Transfer failed. Please try again later.' })
    }
    
    setTransferring(false)
  }

  if (tickets.length === 0) {
    return null // Don't render anything if no tickets to transfer
  }

  return (
    <div className="glass-card p-6 mt-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <LuSend className="text-indigo-500" />
        Transfer Tickets
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Send a ticket to a friend or family member. They must have a registered account.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {tickets.map(ticket => (
            <button
              key={ticket.code}
              onClick={() => { setSelectedTicket(ticket); setStatus(null); }}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedTicket?.code === ticket.code 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <LuTicket className={ticket.type === 'premium' ? 'text-amber-500' : 'text-blue-500'} />
                {ticket.match}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {ticket.code} • {ticket.type === 'premium' ? 'VIP' : 'Standard'}
              </div>
            </button>
          ))}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key="transfer-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-white/5"
              >
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="input-field mb-4"
                />
                <Button 
                  onClick={handleTransfer} 
                  disabled={transferring || !recipientEmail}
                  className="w-full"
                >
                  {transferring ? 'Transferring...' : 'Send Ticket'}
                </Button>

                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                      status.type === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}
                  >
                    {status.type === 'success' ? <LuCheck className="w-5 h-5 shrink-0" /> : <LuX className="w-5 h-5 shrink-0" />}
                    <span>{status.msg}</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div key="empty" className="h-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center p-6 text-center text-slate-400 text-sm">
                Select a ticket from the left to transfer it to someone else.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
