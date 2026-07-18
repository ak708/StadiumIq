import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default:   'border-brand-primary/30 bg-brand-primary/10 text-brand-primary',
    secondary: 'border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/10 text-slate-900/70 dark:text-white/70',
    success:   'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning:   'border-amber-500/30 bg-amber-500/10 text-amber-400',
    danger:    'border-red-500/30 bg-red-500/10 text-red-400',
    purple:    'border-purple-500/30 bg-purple-500/10 text-purple-400',
  }
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
