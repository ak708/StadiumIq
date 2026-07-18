import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { db } from '@/utils/firebase'
import { doc, setDoc } from 'firebase/firestore'
// lucide-react removed
import { IconContext } from 'react-icons';
import { cn } from '@/lib/utils'

import { LuMousePointer2, LuSquare, LuAccessibility, LuZap, LuMove, LuMap, LuTrash2, LuSave } from 'react-icons/lu';

const TOOLS = [
  { id: 'select',     label: 'Select/Move', icon: () => <LuMousePointer2 /> },
  { id: 'standard',   label: 'Standard',    icon: () => <LuSquare />,        color: '#a855f7' }, // purple
  { id: 'accessible', label: 'Accessible',  icon: () => <LuAccessibility />, color: '#06b6d4' }, // cyan
  { id: 'ev',         label: 'EV Spot',     icon: () => <LuZap />,           color: '#10b981' }, // emerald
  { id: 'road',       label: 'Road/Lane',   icon: () => <LuMove />,          color: '#374151' }, // gray
  { id: 'gate',       label: 'Gate/Entrance',icon: () => <LuMap />,          color: '#f59e0b' }, // amber
]

// 10px = 1m. Spot = 2.7m x 5.5m -> 27px x 55px
const SPOT_W = 27
const SPOT_H = 55

export default function ParkingCanvas() {
  const canvasRef = useRef(null)
  const [objects, setObjects] = useState([])
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Initial draw
  useEffect(() => {
    drawCanvas()
  }, [objects, selectedId])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw Grid (10px = 1m)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 10) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke()
    }

    // Draw Objects
    objects.forEach(obj => {
      ctx.save()
      
      if (obj.type === 'road') {
        ctx.fillStyle = '#374151'
        ctx.fillRect(obj.x, obj.y, obj.w || 100, obj.h || 40)
      } else if (obj.type === 'gate') {
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(obj.x, obj.y, SPOT_W, SPOT_H)
        ctx.fillStyle = '#000'
        ctx.font = '10px Arial'
        ctx.fillText('GATE', obj.x + 2, obj.y + 15)
      } else {
        // Parking spots
        ctx.fillStyle = obj.type === 'accessible' ? '#06b6d4' : obj.type === 'ev' ? '#10b981' : '#a855f7'
        ctx.globalAlpha = 0.6
        ctx.fillRect(obj.x, obj.y, SPOT_W, SPOT_H)
        ctx.globalAlpha = 1.0
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = 2
        ctx.strokeRect(obj.x, obj.y, SPOT_W, SPOT_H)
      }

      if (obj.id === selectedId) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(obj.x - 2, obj.y - 2, (obj.w || SPOT_W) + 4, (obj.h || SPOT_H) + 4)
      }

      ctx.restore()
    })
  }

  const getPointerPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e) => {
    const { x, y } = getPointerPos(e)

    if (tool === 'select') {
      // Find clicked object (top-most)
      const clicked = [...objects].reverse().find(obj => 
        x >= obj.x && x <= obj.x + (obj.w || SPOT_W) &&
        y >= obj.y && y <= obj.y + (obj.h || SPOT_H)
      )
      
      if (clicked) {
        setSelectedId(clicked.id)
        setIsDragging(true)
        setDragOffset({ x: x - clicked.x, y: y - clicked.y })
      } else {
        setSelectedId(null)
      }
    } else {
      // Add new object
      const newObj = {
        id: Date.now().toString(),
        type: tool,
        x: Math.round(x / 10) * 10, // snap to grid
        y: Math.round(y / 10) * 10,
        w: tool === 'road' ? 100 : SPOT_W,
        h: tool === 'road' ? 40 : SPOT_H
      }
      setObjects([...objects, newObj])
      setSelectedId(newObj.id)
      setTool('select')
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedId || tool !== 'select') return
    const { x, y } = getPointerPos(e)
    
    setObjects(objects.map(obj => {
      if (obj.id === selectedId) {
        return {
          ...obj,
          x: Math.round((x - dragOffset.x) / 10) * 10,
          y: Math.round((y - dragOffset.y) / 10) * 10
        }
      }
      return obj
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDelete = () => {
    if (selectedId) {
      setObjects(objects.filter(o => o.id !== selectedId))
      setSelectedId(null)
    }
  }

  const handleSave = async () => {
    // Generate STADIUM_PARKING_GRAPH format
    const nodes = {}
    let stdCount = 0, accCount = 0, evCount = 0
    
    objects.forEach(obj => {
      if (obj.type === 'standard') stdCount++
      if (obj.type === 'accessible') accCount++
      if (obj.type === 'ev') evCount++
    })

    nodes['ZONE_A'] = {
      id: 'ZONE_A', type: 'zone', label: 'Main Canvas Zone', floor: 0,
      capacity: stdCount + accCount + evCount,
      occupied: 0, accessible: accCount > 0, ev: evCount > 0
    }

    const payload = {
      nodes,
      edges: [],
      rawObjects: objects // save raw layout for future editing
    }

    try {
      if (db) {
        await setDoc(doc(db, 'config', 'parking_graph'), payload)
        alert('Layout saved to Firestore successfully!')
      } else {
        alert('Demo mode: Layout saved in memory.\n' + JSON.stringify(payload, null, 2))
      }
    } catch (e) {
      console.error(e)
      alert('Error saving layout.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl">
        {TOOLS.map(t => (
          <Button
            key={t.id}
            variant={tool === t.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool(t.id)}
            className="gap-2 text-xs h-8"
          >
            <t.icon className="w-3.5 h-3.5" style={{ color: tool !== t.id ? t.color : undefined }} />
            {t.label}
          </Button>
        ))}
        
        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />
        
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!selectedId} className="gap-2 text-xs h-8">
          <LuTrash2  className="w-3.5 h-3.5"  /> Delete Selected
        </Button>
        
        <Button onClick={handleSave} size="sm" className="ml-auto gap-2 text-xs h-8 bg-brand-primary hover:bg-brand-primary/80">
          <LuSave  className="w-3.5 h-3.5"  /> Save Layout
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden border border-slate-300 dark:border-white/10 rounded-xl bg-[#0B1120] relative">
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-[0.65rem] text-slate-900/50 dark:text-white/50 border border-slate-300 dark:border-white/10">
            Scale: 10px = 1m
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair w-full max-w-[800px] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-repeat"
          />
        </div>

        {/* Info Panel */}
        <Card className="w-64 p-4 shrink-0 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-300 dark:border-white/10 pb-2">Properties</h3>
          
          {selectedId ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-slate-900/60 dark:text-white/60">Selected Object</div>
              <Badge variant="outline" className="w-fit">{objects.find(o => o.id === selectedId)?.type}</Badge>
              <div className="text-[0.65rem] font-mono text-slate-900/40 dark:text-white/40 mt-2">
                ID: {selectedId}<br/>
                X: {objects.find(o => o.id === selectedId)?.x} px<br/>
                Y: {objects.find(o => o.id === selectedId)?.y} px
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-900/40 dark:text-white/40 italic">No object selected</div>
          )}

          <div className="mt-auto flex flex-col gap-2 border-t border-slate-300 dark:border-white/10 pt-4">
            <h4 className="text-xs font-bold text-slate-900/60 dark:text-white/60">Layout Summary</h4>
            <div className="text-xs flex justify-between">
              <span className="text-slate-900/50 dark:text-white/50">Total Spots:</span>
              <span className="font-bold">{objects.filter(o => ['standard', 'accessible', 'ev'].includes(o.type)).length}</span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-cyan-400">Accessible:</span>
              <span className="font-bold">{objects.filter(o => o.type === 'accessible').length}</span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-emerald-400">EV Charging:</span>
              <span className="font-bold">{objects.filter(o => o.type === 'ev').length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
