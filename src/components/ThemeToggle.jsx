// lucide-react removed
import { IconContext } from 'react-icons';
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'

import { LuSun, LuMoon } from 'react-icons/lu';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      id="btn-theme-toggle"
      className="text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
    >
      {theme === 'dark'
        ? <LuSun  className="h-4 w-4"  />
        : <LuMoon  className="h-4 w-4"  />
      }
    </Button>
  )
}
