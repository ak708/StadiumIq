import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import AccessibilityBar from './components/AccessibilityBar'
import UserMenu from './components/UserMenu'
import ThemeToggle from './components/ThemeToggle'
import MatchSelector from './components/MatchSelector'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FanAssist from './pages/FanAssist'
import SmartParking from './pages/SmartParking'
import CrowdOps from './pages/CrowdOps'
import StaffBrief from './pages/StaffBrief'
import SafetyMap from './pages/SafetyMap'
import AdminParking from './pages/AdminParking'
import VolunteerManagement from './pages/VolunteerManagement'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import StadiumHub from './pages/StadiumHub'
import TicketPortal from './pages/TicketPortal'
import './index.css'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
}

const pageTransition = { duration: 0.25, ease: 'easeOut' }

function IndexRedirect() {
  const { profile } = useAuth()
  if (profile?.role === 'volunteer') return <Navigate to="/volunteers" replace />
  return <Navigate to="/dashboard" replace />
}

function AnimatedRoutes({ ctx }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<IndexRedirect />} />
        
        <Route path="/tickets" element={
          <ProtectedRoute requiredRole={['fan', 'staff', 'admin']}><PageWrap><TicketPortal /></PageWrap></ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole={['fan', 'staff', 'admin']}><PageWrap><Dashboard ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/fan-assist" element={
          <ProtectedRoute requiredRole={['fan', 'volunteer', 'staff', 'admin']}><PageWrap><FanAssist ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/parking" element={
          <ProtectedRoute requiredRole={['fan', 'staff', 'admin']}><PageWrap><SmartParking ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/safety" element={
          <ProtectedRoute requiredRole={['fan', 'staff', 'admin']}><PageWrap><SafetyMap ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/hub" element={
          <ProtectedRoute requiredRole={['fan', 'staff', 'admin']}><PageWrap><StadiumHub ctx={ctx} /></PageWrap></ProtectedRoute>
        } />

        {/* Staff + Admin only */}
        <Route path="/crowd-ops" element={
          <ProtectedRoute requiredRole="staff"><PageWrap><CrowdOps ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/staff-brief" element={
          <ProtectedRoute requiredRole={['staff', 'volunteer']}><PageWrap><StaffBrief ctx={ctx} /></PageWrap></ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><PageWrap><AdminParking ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/volunteers" element={
          <ProtectedRoute requiredRole={['admin', 'volunteer']}><PageWrap><VolunteerManagement ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute requiredRole="admin"><PageWrap><AnalyticsDashboard ctx={ctx} /></PageWrap></ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function PageWrap({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}

function AppShell() {
  const { user, profile, activeTicket } = useAuth()
  const [audioMode, setAudioMode]       = useState(false)
  const [visualMode, setVisualMode]     = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [aslMode, setAslMode]           = useState(false)
  const [calmMode, setCalmMode]         = useState(false)
  const [language, setLanguage]         = useState('en')
  const [activePage, setActivePage]     = useState('dashboard')

  if (typeof document !== 'undefined') {
    const isPremium = activeTicket?.type === 'premium'
    const cls = [
      audioMode && 'audio-mode',
      visualMode && 'visual-mode',
      highContrast && 'high-contrast',
      calmMode && 'sensory-calm',
      isPremium && 'premium-theme'
    ].filter(Boolean).join(' ')
    document.body.className = cls
  }

  const ctx = { audioMode, visualMode, highContrast, aslMode, calmMode, language, setLanguage }

  const hasTickets = profile?.tickets?.length > 0 || profile?.ticket
  const showSidebar = user && (profile?.role !== 'fan' || hasTickets)

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="page-wrapper">
      {/* Sidebar — hidden on mobile and for ticketless fans */}
      {showSidebar && (
        <aside className="hidden md:flex sidebar">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </aside>
      )}

      {/* Main area */}
      <div className="main-content">
        {/* Top bar */}
        <header className="a11y-bar sticky top-0 z-10 bg-glass backdrop-blur-xl">
          <AccessibilityBar
            audioMode={audioMode} setAudioMode={setAudioMode}
            visualMode={visualMode} setVisualMode={setVisualMode}
            highContrast={highContrast} setHighContrast={setHighContrast}
            aslMode={aslMode} setAslMode={setAslMode}
            calmMode={calmMode} setCalmMode={setCalmMode}
            language={language} setLanguage={setLanguage}
          />
          <div className="ml-auto flex items-center gap-2 pl-2">
            <MatchSelector />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6">
          <AnimatedRoutes ctx={ctx} />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav activePage={activePage} setActivePage={setActivePage} />

      {/* Global ASL Overlay */}
      {aslMode && <ASLOverlay />}
    </div>
  )
}

function ASLOverlay() {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-32 md:w-48 aspect-video bg-black rounded-lg border-2 border-indigo-500 overflow-hidden shadow-2xl z-50 pointer-events-none">
      {/* Mock looping ASL video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="w-full h-full object-cover opacity-90"
        src="https://cdn.pixabay.com/video/2021/04/13/71018-537446549_tiny.mp4"
      />
      <div className="absolute top-1 left-2 text-[0.55rem] font-bold text-white bg-black/50 px-1 rounded uppercase tracking-wider">
        ASL LIVE
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
