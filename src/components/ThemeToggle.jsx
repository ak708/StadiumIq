import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'

import { LuSun, LuMoon } from 'react-icons/lu';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative w-9 h-9 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"
    >
      {theme === 'dark'
        ? <LuSun  className="h-4 w-4"  />
        : <LuMoon  className="h-4 w-4"  />
      }
    </Button>
  )
}
