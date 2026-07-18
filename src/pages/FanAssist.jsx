import { useState, useRef, useEffect, useCallback } from 'react'
import { stopSpeaking, speakText } from '@/utils/gemini'
import { getSmartResponse } from '@/utils/faqCache'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/utils/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'
// lucide-react removed
import { IconContext } from 'react-icons';
import { cn } from '@/lib/utils'

import { LuZap, LuVolumeX, LuTrash2, LuMic, LuSend } from 'react-icons/lu';
import TravelAgent from '@/components/TravelAgent'

const SUGGESTED_QUESTIONS = {
  en: ['Where is my seat?', 'Nearest food stand?', 'Accessible entrance?', 'Book parking', 'Medical emergency', 'Buy merchandise'],
  ja: ['席はどこですか？', '最寄りの売店？', '障害者用入口？', '駐車場を予約'],
  ar: ['أين مقعدي؟', 'أقرب بائع طعام؟', 'مدخل ذوي الإعاقة؟'],
  es: ['¿Dónde está mi asiento?', '¿Tienda de comida?', '¿Entrada accesible?'],
  fr: ['Où est mon siège?', 'Stand alimentaire?', 'Entrée accessible?'],
  ko: ['내 좌석은 어디?', '가장 가까운 매점?', '장애인 입구?'],
  de: ['Wo ist mein Sitz?', 'Nächster Essensstand?', 'Barrierefreier Eingang?'],
  pt: ['Onde é meu assento?', 'Barraca de comida?', 'Entrada acessível?'],
}

// ── Welcome message per language ──────────────────────────
function getWelcomeMessage(language) {
  const messages = {
    ja: 'こんにちは！StadiumIQ FanAssistへようこそ。FIFAワールドカップ2026を楽しみましょう！⚽🏆',
    ar: 'مرحباً بك في StadiumIQ FanAssist! كيف يمكنني مساعدتك اليوم؟ ⚽🏆',
    es: '¡Bienvenido a StadiumIQ FanAssist! ¿En qué puedo ayudarte hoy? ⚽🏆',
    fr: 'Bienvenue sur StadiumIQ FanAssist! Comment puis-je vous aider? ⚽🏆',
    ko: 'StadiumIQ FanAssist에 오신 것을 환영합니다! 무엇이든 물어보세요! ⚽🏆',
    de: 'Willkommen bei StadiumIQ FanAssist! Wie kann ich Ihnen helfen? ⚽🏆',
    pt: 'Bem-vindo ao StadiumIQ FanAssist! Como posso ajudar? ⚽🏆',
    en: 'Welcome to StadiumIQ FanAssist! 🏆 I\'m your AI assistant for FIFA World Cup 2026. Ask me anything about directions, food, parking, accessibility, and more! ⚽',
  }
  return {
    id: 'welcome',
    role: 'assistant',
    content: messages[language] || messages.en,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

const STORAGE_KEY = 'fanassist_chat_v2'

export default function FanAssist({ ctx }) {
  const { audioMode, visualMode, language } = ctx

  const { profile } = useAuth()
  const [messages, setMessages] = useState([getWelcomeMessage(language)])
  const [input, setInput]       = useState('')
  const [activeTab, setActiveTab] = useState('assistant')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const recognitionRef = useRef(null)

  // ── Load messages from Firestore ────────────────────────
  useEffect(() => {
    if (!profile?.uid || !db) return;
    const fetchChat = async () => {
      try {
        const chatRef = doc(db, 'users', profile.uid, 'chat_sessions', 'fanassist');
        const snap = await getDoc(chatRef);
        if (snap.exists() && snap.data().messages?.length > 0) {
          setMessages(snap.data().messages);
        } else {
          setMessages([getWelcomeMessage(language)]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchChat();
  }, [profile?.uid, language]);

  // ── Persist messages to Firestore ────────────────────────
  useEffect(() => {
    if (!profile?.uid || !db || messages.length <= 1) return;
    const saveChat = async () => {
      try {
        const chatRef = doc(db, 'users', profile.uid, 'chat_sessions', 'fanassist');
        await setDoc(chatRef, {
          messages,
          lastUpdated: new Date().toISOString(),
          language
        }, { merge: true });
      } catch (err) {
        console.error('Failed to save chat history:', err);
      }
    };
    saveChat();
  }, [messages, profile?.uid, language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-speak last AI message in audio mode
  useEffect(() => {
    if (audioMode && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant') speakText(last.content, language)
    }
  }, [messages, audioMode, language])

  const clearChat = useCallback(async () => {
    setMessages([getWelcomeMessage(language)])
    if (profile?.uid && db) {
      try {
        const chatRef = doc(db, 'users', profile.uid, 'chat_sessions', 'fanassist');
        await setDoc(chatRef, { messages: [] }, { merge: true });
      } catch (err) { console.error(err) }
    }
  }, [language, profile?.uid])

  const sendMessage = useCallback(async (text = input) => {
    if (!text.trim() || isLoading) return
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const response = await getSmartResponse(history, language)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Having trouble connecting. Please try again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, language])

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition
    const langMap = { en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', ja:'ja-JP', ko:'ko-KR', ar:'ar-SA', pt:'pt-BR' }
    recognition.lang = langMap[language] || 'en-US'
    recognition.onstart  = () => setIsListening(true)
    recognition.onend    = () => setIsListening(false)
    recognition.onresult = e => { const t = e.results[0][0].transcript; setInput(t); sendMessage(t) }
    recognition.onerror  = () => setIsListening(false)
    recognition.start()
  }

  const suggestions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en

  const placeholders = {
    ja: '日本語でご質問ください…', ar: 'اكتب سؤالك هنا…',
    es: 'Escribe tu pregunta…', ko: '여기에 질문을 입력하세요…',
    fr: 'Posez votre question…', de: 'Stellen Sie Ihre Frage…',
    pt: 'Digite sua pergunta…',
    en: 'Ask me anything — directions, food, parking, accessibility…',
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 px-1 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="default"><LuZap  className="w-3 h-3"  /> Gemini 2.0 Flash</Badge>
            <Badge variant="success">● Online</Badge>
            {audioMode  && <Badge variant="warning">🔊 Audio</Badge>}
            {visualMode && <Badge variant="purple">🎙️ Live Commentary</Badge>}
          </div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">FanAssist AI</h1>
          <p className="text-sm text-slate-900/50 dark:text-white/50">Multilingual AI assistant for FIFA World Cup 2026 fans</p>
        </div>
        <div className="flex gap-2">
          {audioMode && (
            <Button variant="ghost" size="sm" onClick={stopSpeaking} id="btn-stop-speech">
              <LuVolumeX  className="w-4 h-4"  /> Stop
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearChat} id="btn-clear-chat" className="text-slate-900/40 dark:text-white/40 hover:text-slate-900/80 dark:hover:text-white/80">
            <LuTrash2  className="w-4 h-4"  />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4 px-1">
        <Button 
          variant={activeTab === 'assistant' ? 'default' : 'outline'}
          onClick={() => setActiveTab('assistant')}
          size="sm"
          className="rounded-full"
        >
          General Assistant
        </Button>
        <Button 
          variant={activeTab === 'travel' ? 'default' : 'outline'}
          onClick={() => setActiveTab('travel')}
          size="sm"
          className="rounded-full"
        >
          Travel Concierge (Maps)
        </Button>
      </div>

      {activeTab === 'assistant' ? (
        <>
          {/* Suggested questions */}
          <div className="flex gap-2 flex-wrap pb-3 px-1">
            {suggestions.map(q => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="text-xs h-7 rounded-full border-slate-300 dark:border-white/10 text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-white/25"
                id={`suggest-${q.substring(0,15).replace(/[^a-zA-Z0-9]/g,'-')}`}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Messages */}
          <div className="chat-messages flex-1 scrollbar-thin">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-3 items-end', msg.role === 'user' && 'flex-row-reverse')}>
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mb-1',
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-slate-300 dark:border-white/10 text-base'
                    : 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10'
                )}>
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className={cn('flex flex-col gap-1', msg.role === 'user' && 'items-end')}>
                  {visualMode && msg.role === 'assistant' && (
                    <div className="text-[0.6rem] font-bold text-amber-400 uppercase tracking-wider px-1">🎙️ Match Event</div>
                  )}
                  <div className={cn('message-bubble', msg.role === 'user' ? 'user' : 'ai')}>
                    {msg.content}
                  </div>
                  <div className="text-[0.6rem] text-slate-900/30 dark:text-white/30 px-1">{msg.time}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-base">🤖</div>
                <div className="message-bubble ai">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="pt-3 border-t border-slate-300 dark:border-white/10">
            {visualMode && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-semibold">
                🎙️ Live Audio Commentary Active — Match events are being narrated
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Button
                id="btn-voice-input"
                variant={isListening ? 'destructive' : 'secondary'}
                size="icon"
                onClick={startVoice}
                title="Voice input"
                aria-label="Voice input"
                className="flex-shrink-0"
              >
                {isListening ? '🔴' : <LuMic  className="w-4 h-4"  />}
              </Button>
              <textarea
                ref={inputRef}
                id="fan-assist-input"
                className="input-field flex-1 resize-none min-h-[40px] max-h-32 py-2.5 scrollbar-thin"
                placeholder={placeholders[language] || placeholders.en}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                rows={1}
                aria-label="Message input"
              />
              <Button
                id="btn-send-message"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
                aria-label="Send message"
              >
                <LuSend  className="w-4 h-4"  />
              </Button>
            </div>
            <p className="text-center text-[0.65rem] text-slate-900/25 dark:text-white/25 mt-2">
              Powered by Google Gemini 2.0 · 20+ languages · Real-time stadium intelligence
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <TravelAgent />
        </div>
      )}
    </div>
  )
}
