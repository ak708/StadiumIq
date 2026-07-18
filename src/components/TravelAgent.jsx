import { useState } from 'react'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { Button } from '@/components/ui/button'
import { chatWithGemini } from '@/utils/gemini'
import { LuSend, LuMapPin } from 'react-icons/lu'
import { useAuth } from '@/context/AuthContext'

export default function TravelAgent() {
  const [address, setAddress] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()
  
  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (!address) return
    setMessages([
      { role: 'model', parts: [{ text: `I see you're coming from ${address}. Do you need driving directions, or are you looking for flights/trains?` }] }
    ])
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    
    const newMessages = [...messages, { role: 'user', parts: [{ text: userMsg }] }]
    setMessages(newMessages)
    setLoading(true)
    
    try {
      const response = await chatWithGemini(newMessages, 'travelAgent', profile?.lang || 'en')
      setMessages([...newMessages, { role: 'model', parts: [{ text: response }] }])
    } catch (_err) {
      setMessages([...newMessages, { role: 'model', parts: [{ text: "Error connecting to Travel Agent AI." }] }])
    } finally {
      setLoading(false)
    }
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const stadiumLocation = { lat: 40.8128, lng: -74.0742 } // MetLife Stadium

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <LuMapPin className="text-brand-primary" /> Route to Stadium
        </h2>
        
        <form onSubmit={handleAddressSubmit} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Enter your home address or city..." 
            className="input-field flex-1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button type="submit">Plan Route</Button>
        </form>

        <div className="h-64 rounded-xl overflow-hidden border border-slate-300 dark:border-white/10 relative">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map defaultZoom={13} defaultCenter={stadiumLocation} mapId="stadium_map">
                <Marker position={stadiumLocation} />
              </Map>
            </APIProvider>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 text-sm p-4 text-center">
              <LuMapPin className="w-8 h-8 opacity-50 mb-2" />
              Google Maps API Key not configured.
              <br/>Add VITE_GOOGLE_MAPS_API_KEY to .env to enable the interactive map.
            </div>
          )}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="glass-card flex flex-col h-96">
          <div className="p-4 border-b border-slate-300 dark:border-white/10 bg-brand-primary/5">
            <h3 className="font-bold">AI Travel Concierge</h3>
            <p className="text-xs text-slate-500">Flight, train, and transit arrangements</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className={`message-bubble ${m.role === 'user' ? 'user self-end' : 'ai self-start'}`}>
                {m.parts[0].text}
              </div>
            ))}
            {loading && (
              <div className="typing-dots ml-2 mt-2">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            )}
          </div>
          
          <form onSubmit={handleChat} className="p-4 border-t border-slate-300 dark:border-white/10 flex gap-2">
            <input 
              type="text" 
              className="input-field flex-1"
              placeholder="E.g. What's the best flight from Chicago?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="px-3">
              <LuSend />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
