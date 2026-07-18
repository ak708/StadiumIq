import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// lucide-react removed
import { IconContext } from 'react-icons';

import { LuCircle, LuUsers, LuMessageSquare, LuTrendingUp } from 'react-icons/lu';

export default function AnalyticsDashboard() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="purple"><LuCircle  className="w-3 h-3 mr-1"  /> Analytics</Badge>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Match Analytics</h1>
        <p className="text-sm text-slate-900/50 dark:text-white/50">Post-match reporting, occupancy trends, and AI query volume.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border-brand-primary/20 bg-brand-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Peak Occupancy</h2>
            <LuUsers  className="w-5 h-5 text-brand-primary"  />
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">82,450</div>
          <div className="text-xs text-slate-900/50 dark:text-white/50 mt-1">99.8% of total capacity</div>
        </Card>

        <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Queries Handled</h2>
            <LuMessageSquare  className="w-5 h-5 text-emerald-400"  />
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">14,203</div>
          <div className="text-xs text-slate-900/50 dark:text-white/50 mt-1">Peak: 450 queries/min at Halftime</div>
        </Card>

        <Card className="p-6 border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Average Gate Wait</h2>
            <LuTrendingUp  className="w-5 h-5 text-cyan-400"  />
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">4.2 min</div>
          <div className="text-xs text-slate-900/50 dark:text-white/50 mt-1">-18% compared to previous match</div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Languages Used</h2>
        <div className="flex flex-col gap-4">
          {[
            { lang: 'English (US)', count: '8,400', pct: 60, color: 'bg-brand-primary' },
            { lang: 'Spanish (ES)', count: '3,200', pct: 22, color: 'bg-emerald-400' },
            { lang: 'Portuguese (BR)', count: '1,100', pct: 8, color: 'bg-cyan-400' },
            { lang: 'French (FR)', count: '800', pct: 5, color: 'bg-purple-400' },
            { lang: 'Other', count: '703', pct: 5, color: 'bg-slate-200 dark:bg-white/20' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32 text-sm font-semibold text-slate-900/80 dark:text-white/80">{l.lang}</div>
              <div className="flex-1 h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${l.color}`} style={{ width: `${l.pct}%` }} />
              </div>
              <div className="w-16 text-right text-xs text-slate-900/50 dark:text-white/50">{l.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
