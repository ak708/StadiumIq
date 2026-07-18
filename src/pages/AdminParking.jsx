import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
// lucide-react removed
import { IconContext } from 'react-icons';
import ParkingCanvas from '@/components/ParkingCanvas'

import { LuZap } from 'react-icons/lu';

export default function AdminParking() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="warning">⚙️ Admin Only</Badge>
          <Badge variant="purple"><LuZap  className="w-3 h-3 mr-1"  /> Canvas Editor</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Parking Layout Admin</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">Configure parking zones with HTML5 Canvas</p>
      </div>
      <ParkingCanvas />
    </div>
  )
}
