import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-brand-primary to-cyan-400 text-surface shadow-glow-primary hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]',
        destructive:
          'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30',
        outline:
          'border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-900 dark:text-white',
        secondary:
          'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-900/80 dark:text-white/80 hover:bg-slate-300 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
        ghost:
          'text-slate-900/60 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
        link: 'text-brand-primary underline-offset-4 hover:underline',
        success:
          'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30',
        warning:
          'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
