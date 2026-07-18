import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LuMapPin, LuShoppingBag, LuCamera, LuCoffee, LuNavigation, LuMap, LuTicket, LuFrame, LuCheck, LuArrowRight, LuCar, LuStar } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'

export default function StadiumHub() {
  const [activeTab, setActiveTab] = useState('journey')
  const { activeTicket } = useAuth()
  const isPremium = activeTicket?.type === 'premium'

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="flex flex-col h-full space-y-6 pb-20">
        <div className="px-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Beyond the Stadium</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your journey, merch, and memories for {activeTicket?.match || 'the upcoming match'}.</p>
        </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
        <button onClick={() => setActiveTab('journey')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'journey' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
          📍 Journey & Map
        </button>
        <button onClick={() => setActiveTab('commerce')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'commerce' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
          🍔 In-Seat Orders
        </button>
        <button onClick={() => setActiveTab('memories')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'memories' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
          📸 FanCam Memories
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'journey' && (
          <motion.div key="journey" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 px-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm">
              <LiveETACalculator isPremium={isPremium} />

              <h3 className="font-semibold text-sm mb-2 text-slate-600 dark:text-slate-400 mt-6">Recommended Stops Along Your Route</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center"><LuShoppingBag /></div>
                    <div>
                      <p className="font-bold text-sm">Official Merch Store</p>
                      <p className="text-xs text-slate-500">+2 mins detour • Buy flags & scarves</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">Add Stop</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'commerce' && (
          <motion.div key="commerce" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 px-2">
             <div className="grid grid-cols-2 gap-4">
                {/* Snack Order */}
                <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between`}>
                  <div>
                    <div className={`w-10 h-10 ${isPremium ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'} rounded-full flex items-center justify-center mb-3`}><LuCoffee className="w-5 h-5"/></div>
                    <h3 className="font-bold text-md">In-Seat Snacks</h3>
                    <p className="text-xs text-slate-500 mb-4">Hotdogs & drinks delivered to Section 112.</p>
                  </div>
                  <Button className={`w-full ${isPremium ? 'bg-amber-500 hover:bg-amber-600' : 'bg-orange-500 hover:bg-orange-600'}`}>Order Now</Button>
                </div>

                {/* Merch Order */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className={`w-10 h-10 ${isPremium ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'} rounded-full flex items-center justify-center mb-3`}><LuTicket className="w-5 h-5"/></div>
                    <h3 className="font-bold text-md">Express Merch</h3>
                    <p className="text-xs text-slate-500 mb-4">Buy online, pick up at express lane Gate B.</p>
                  </div>
                  <Button className={`w-full ${isPremium ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'}`}>Browse Shop</Button>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'memories' && (
          <motion.div key="memories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 px-2">
            <div className={`bg-gradient-to-br ${isPremium ? 'from-amber-400 to-yellow-600' : 'from-indigo-500 to-purple-600'} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-20"><LuCamera className="w-24 h-24" /></div>
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white mb-3 hover:bg-white/30 backdrop-blur-sm border-0">New</Badge>
                <h2 className="text-2xl font-bold mb-2">You were on the FanCam!</h2>
                <p className="text-indigo-100 text-sm mb-6 max-w-[200px]">We spotted you celebrating in Section 112 during the 45th minute.</p>
                
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm mb-6">
                  <div className="w-full h-32 bg-black/20 rounded-lg flex items-center justify-center relative border border-white/20">
                     <span className="text-white/50 text-xs tracking-widest font-bold uppercase absolute">Preview Watermarked</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button className={`w-full bg-white ${isPremium ? 'text-amber-600 hover:bg-amber-50' : 'text-indigo-600 hover:bg-indigo-50'} flex items-center justify-center gap-2`}>
                    <LuCheck /> Claim Digital Copy (Free)
                  </Button>
                  <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 flex items-center justify-center gap-2">
                    <LuFrame /> Buy Framed Print ($25)
                  </Button>
                  <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 flex items-center justify-center gap-2">
                    Enter Lucky Draw 🎁
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </APIProvider>
  )
}

function LiveETACalculator({ isPremium }) {
  const routesLibrary = useMapsLibrary('routes')
  const [address, setAddress] = useState('')
  const [eta, setEta] = useState(null)
  const [distance, setDistance] = useState(null)
  const [mode, setMode] = useState('TRANSIT') // TRANSIT or DRIVING
  const [isWheelchairAccessible, setIsWheelchairAccessible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!routesLibrary || !address) return

    const timeoutId = setTimeout(() => {
      calculateRoute()
    }, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [address, mode, isWheelchairAccessible, routesLibrary])

  const calculateRoute = () => {
    if (!address.trim() || !routesLibrary) return
    setLoading(true)
    setError('')
    
    const service = new routesLibrary.DistanceMatrixService()
    
    const request = {
      origins: [address],
      destinations: ['MetLife Stadium, 1 MetLife Stadium Dr, East Rutherford, NJ 07073'],
      travelMode: mode,
    }

    if (mode === 'TRANSIT' && isWheelchairAccessible) {
      request.transitOptions = { routingPreference: 'FEWER_TRANSFERS' }
    }

    service.getDistanceMatrix(request, (response, status) => {
      setLoading(false)
      if (status === 'OK') {
        const element = response.rows[0].elements[0]
        if (element.status === 'OK') {
          setEta(element.duration.text)
          setDistance(element.distance.text)
        } else {
          setError('Route not found.')
          setEta(null)
          setDistance(null)
        }
      } else {
        setError('Failed to calculate route.')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <LuMap className={isPremium ? "text-amber-500" : "text-indigo-500"} /> Route to Stadium
        </h2>
        <div className="flex gap-2">
           <button onClick={() => setMode('TRANSIT')} className={`text-xs px-2 py-1 rounded-full font-bold ${mode === 'TRANSIT' ? (isPremium ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300') : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>Transit</button>
           <button onClick={() => setMode('DRIVING')} className={`text-xs px-2 py-1 rounded-full font-bold ${mode === 'DRIVING' ? (isPremium ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300') : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>Drive</button>
        </div>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Enter your starting address (e.g. JFK Airport)" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
        />
        {mode === 'TRANSIT' && (
          <label className="flex items-center gap-2 mt-2 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={isWheelchairAccessible} onChange={e => setIsWheelchairAccessible(e.target.checked)} className="rounded border-slate-300" />
            Prefer Wheelchair Accessible / Fewer Transfers
          </label>
        )}
      </div>

      <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.8128,-74.0742&zoom=11&size=600x300&maptype=roadmap&style=feature:all|element:labels|visibility:off')] bg-cover bg-center" />
        <div className="z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
          {loading ? (
             <span className="text-white text-sm font-semibold">Calculating...</span>
          ) : eta ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-white text-sm font-semibold">ETA: {eta} ({distance})</span>
            </>
          ) : error ? (
            <span className="text-red-400 text-sm font-semibold">{error}</span>
          ) : (
            <span className="text-white/60 text-sm font-semibold">Enter address for ETA</span>
          )}
        </div>
      </div>

      {isPremium && mode === 'DRIVING' && (
         <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
               <LuStar />
             </div>
             <div>
               <p className="text-sm font-bold text-amber-600 dark:text-amber-400">VIP Vehicle Sticker</p>
               <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Request priority parking access</p>
             </div>
           </div>
           <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Request</Button>
         </div>
      )}
    </div>
  )
}

function Badge({ children, className }) {
  return <span className={`px-2 py-1 text-[0.65rem] uppercase font-bold rounded-full ${className}`}>{children}</span>
}
