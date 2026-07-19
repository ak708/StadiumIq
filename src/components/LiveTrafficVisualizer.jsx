import React, { useEffect, useRef, useState } from 'react'
import { STADIUM_GRAPH, calculateDynamicRoute } from '../utils/graphEngine'

const NODE_POSITIONS = {
  'GATE_A': { x: 150, y: 50 },
  'GATE_B': { x: 250, y: 150 },
  'GATE_C': { x: 150, y: 250 },
  'GATE_D': { x: 50, y: 150 },
  'PARKING_A1': { x: 150, y: 10 },
  'PARKING_B1': { x: 290, y: 150 },
  'FOOD_A': { x: 110, y: 80 },
  'MED_A': { x: 190, y: 80 },
  'FOOD_B': { x: 220, y: 110 },
  'MED_C': { x: 190, y: 220 },
  'FOOD_C': { x: 110, y: 220 },
  'SEC_112': { x: 120, y: 180 },
  'SEC_113': { x: 180, y: 180 },
}

export default function LiveTrafficVisualizer({ crowdData = [] }) {
  const canvasRef = useRef(null)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Spawn particles that need to go from PARKING to SECTIONS
    const interval = setInterval(() => {
      const starts = ['PARKING_A1', 'PARKING_B1']
      const ends = ['SEC_112', 'SEC_113']
      
      const startNode = starts[Math.floor(Math.random() * starts.length)]
      const endNode = ends[Math.floor(Math.random() * ends.length)]
      
      const route = calculateDynamicRoute(STADIUM_GRAPH, startNode, endNode, crowdData)
      
      if (route && route.path.length > 1) {
        setParticles(prev => [...prev, {
          id: Date.now() + Math.random(),
          path: route.path,
          currentPathIndex: 0,
          progress: 0,
          speed: 0.01 + Math.random() * 0.015,
          color: startNode === 'PARKING_A1' ? '#38bdf8' : '#a78bfa' // sky-400 or violet-400
        }])
      }
    }, 400) // spawn every 400ms

    return () => clearInterval(interval)
  }, [crowdData])

  useEffect(() => {
    let animationId
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw Edges
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)' // slate-400 with low opacity
      ctx.lineWidth = 2
      STADIUM_GRAPH.edges.forEach(edge => {
        const p1 = NODE_POSITIONS[edge.from]
        const p2 = NODE_POSITIONS[edge.to]
        if (p1 && p2) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      })

      // Draw Nodes
      Object.entries(NODE_POSITIONS).forEach(([nodeId, pos]) => {
        // Find if it's a gate and check density
        let fillStyle = '#334155' // default slate-700
        let radius = 6
        
        if (nodeId.startsWith('GATE_')) {
          const gateName = `Gate ${nodeId.split('_')[1]}`
          const density = crowdData.find(g => g.gate === gateName)?.current || 0
          if (density >= 90) fillStyle = '#ef4444' // red-500
          else if (density >= 75) fillStyle = '#f59e0b' // amber-500
          else fillStyle = '#10b981' // emerald-500
          radius = 8 + (density / 100) * 4
        } else if (nodeId.startsWith('PARKING_')) {
          fillStyle = '#64748b' // slate-500
          radius = 8
        } else if (nodeId.startsWith('SEC_')) {
          fillStyle = '#0ea5e9' // sky-500
          radius = 8
        } else if (nodeId.startsWith('MED_')) {
          fillStyle = '#ec4899' // pink-500
          radius = 5
        } else if (nodeId.startsWith('FOOD_')) {
          fillStyle = '#eab308' // yellow-500
          radius = 5
        }

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = fillStyle
        ctx.fill()
        ctx.strokeStyle = '#0f172a' // slate-900 border
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Draw Label
        ctx.fillStyle = '#94a3b8' // slate-400
        ctx.font = '8px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(nodeId.split('_')[1] || nodeId, pos.x, pos.y + radius + 10)
      })

      // Update and Draw Particles
      setParticles(prev => {
        const nextParticles = []
        prev.forEach(p => {
          p.progress += p.speed
          if (p.progress >= 1) {
            p.progress = 0
            p.currentPathIndex++
          }
          
          if (p.currentPathIndex < p.path.length - 1) {
            const p1 = NODE_POSITIONS[p.path[p.currentPathIndex]]
            const p2 = NODE_POSITIONS[p.path[p.currentPathIndex + 1]]
            
            if (p1 && p2) {
              const x = p1.x + (p2.x - p1.x) * p.progress
              const y = p1.y + (p2.y - p1.y) * p.progress
              
              ctx.beginPath()
              ctx.arc(x, y, 3, 0, Math.PI * 2)
              ctx.fillStyle = p.color
              ctx.fill()
              
              nextParticles.push(p)
            }
          }
        })
        return nextParticles
      })

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationId)
  }, [crowdData])

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className="text-[0.6rem] font-bold text-white/50 tracking-wider">AI ROUTING ENGINE</div>
        <div className="flex items-center gap-1.5 text-[0.6rem] text-sky-400"><div className="w-2 h-2 rounded-full bg-sky-400"/> Route from Zone A</div>
        <div className="flex items-center gap-1.5 text-[0.6rem] text-violet-400"><div className="w-2 h-2 rounded-full bg-violet-400"/> Route from Zone B</div>
      </div>
    </div>
  )
}
