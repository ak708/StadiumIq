import { useState, useEffect } from 'react'
import { LuMic, LuLanguages } from 'react-icons/lu'
import { motion } from 'framer-motion'

// Mock commentary events. In reality, these would come from Firestore or an API.
const COMMENTARY_EVENTS = [
  { time: "1'", text: "We are underway here at Emirates Stadium!", es: "¡Comenzamos aquí en el Emirates Stadium!", fr: "C'est parti ici à l'Emirates Stadium!" },
  { time: "5'", text: "Early pressure from Arsenal, pinning City back.", es: "Presión temprana del Arsenal, acorralando al City.", fr: "Pression précoce d'Arsenal, acculant City." },
  { time: "12'", text: "Foul by Rodri in the midfield. Free kick to Arsenal.", es: "Falta de Rodri en el medio campo. Tiro libre para el Arsenal.", fr: "Faute de Rodri au milieu de terrain. Coup franc pour Arsenal." },
  { time: "24'", text: "GOAL! Saka cuts inside and fires it into the top corner!", es: "¡GOL! ¡Saka recorta hacia adentro y dispara a la escuadra!", fr: "BUT ! Saka repique dans l'axe et tire dans la lucarne !" },
  { time: "30'", text: "City trying to respond. De Bruyne finds space but the shot is blocked.", es: "City intenta responder. De Bruyne encuentra espacio pero el tiro es bloqueado.", fr: "City essaie de réagir. De Bruyne trouve de l'espace mais le tir est contré." }
]

export default function LiveMatchCenter({ ctx, isLive }) {
  const { audioMode, language } = ctx
  const [events, setEvents] = useState([])
  const [eventIndex, setEventIndex] = useState(0)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      if (eventIndex < COMMENTARY_EVENTS.length) {
        const newEvent = COMMENTARY_EVENTS[eventIndex]
        
        // Add to the visual feed
        setEvents((prev) => [newEvent, ...prev].slice(0, 5)) // keep last 5
        setEventIndex((prev) => prev + 1)

        // Text-to-Speech logic (Accessible Audio Commentary)
        if (audioMode && 'speechSynthesis' in window) {
          const textToSpeak = language === 'es' ? newEvent.es : 
                              language === 'fr' ? newEvent.fr : 
                              newEvent.text

          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          
          // Try to set appropriate language voice
          utterance.lang = language === 'es' ? 'es-ES' : 
                           language === 'fr' ? 'fr-FR' : 
                           'en-US'
                           
          window.speechSynthesis.speak(utterance)
        }
      } else {
        clearInterval(interval)
      }
    }, 8000) // Emit a new event every 8 seconds for the demo

    return () => {
      clearInterval(interval)
      window.speechSynthesis.cancel() // Stop speaking if unmounted
    }
  }, [isLive, eventIndex, audioMode, language])

  if (!isLive) return null

  return (
    <div className="glass-card p-4 md:p-6 mb-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/20 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <LuMic className="text-red-500 animate-pulse" />
          Live Accessibility Center
        </h3>
        {audioMode && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <LuLanguages /> {language.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 italic">Waiting for match updates...</div>
        ) : (
          events.map((ev, i) => (
            <motion.div 
              key={ev.time + i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: i === 0 ? 1 : 0.6, y: 0 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${i === 0 ? 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10' : ''}`}
            >
              <div className="text-xs font-bold text-red-500 w-8 pt-0.5 shrink-0">{ev.time}</div>
              <div className={`text-sm ${i === 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {language === 'es' ? ev.es : language === 'fr' ? ev.fr : ev.text}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {audioMode && (
        <div className="mt-4 text-[0.65rem] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Text-to-Speech Commentary Active
        </div>
      )}
    </div>
  )
}
