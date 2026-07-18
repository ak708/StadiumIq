import { LuEye, LuVolume2, LuType, LuBrain, LuVideo } from 'react-icons/lu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
// lucide-react removed
import { IconContext } from 'react-icons';

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

function ToggleBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
        active ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="text-xs hidden sm:inline">{label}</span>
    </button>
  )
}

export default function AccessibilityBar({
  audioMode, setAudioMode,
  visualMode, setVisualMode,
  highContrast, setHighContrast,
  aslMode, setAslMode,
  calmMode, setCalmMode,
  language, setLanguage,
}) {
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  return (
    <div className="flex items-center gap-3 flex-wrap py-1 flex-1 min-w-0">
      {/* Audio mode */}
      <label className="flex items-center gap-1.5 cursor-pointer group" title="Audio Mode — AI reads responses aloud">
        <Switch
          id="toggle-audio"
          checked={audioMode}
          onCheckedChange={setAudioMode}
          aria-label="Toggle Audio Mode"
        />
        <LuVolume2  className="w-3.5 h-3.5 text-slate-900/50 dark:text-white/50 group-hover:text-white/80 transition-colors"  />
        <span className="text-xs text-slate-900/50 dark:text-white/50 group-hover:text-white/80 transition-colors hidden sm:inline">Audio</span>
      </label>

      {/* Live Audio Commentary */}
      <label className="flex items-center gap-1.5 cursor-pointer group" title="Live Audio Commentary — Accessible live match feed">
        <Switch
          id="toggle-commentary"
          checked={visualMode}
          onCheckedChange={setVisualMode}
          aria-label="Toggle Live Commentary"
        />
        <LuVolume2  className="w-3.5 h-3.5 text-slate-900/50 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/80 transition-colors"  />
        <span className="text-xs text-slate-900/50 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/80 transition-colors hidden sm:inline">Commentary</span>
      </label>

      <ToggleBtn 
        active={highContrast} 
        onClick={() => setHighContrast(!highContrast)}
        icon={LuEye} 
        label="High Contrast"
      />
      <ToggleBtn 
        active={aslMode} 
        onClick={() => setAslMode(!aslMode)}
        icon={LuVideo} 
        label="ASL Sign"
      />
      <ToggleBtn 
        active={calmMode} 
        onClick={() => setCalmMode(!calmMode)}
        icon={LuBrain} 
        label="Calm Mode"
      />
      <div className="h-4 w-px bg-slate-300 dark:bg-white/20 mx-1" />

      {/* Language selector dropdown */}
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger
          id="language-select"
          className="h-8 w-auto min-w-[120px] text-xs border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5"
          aria-label="Select language"
        >
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(lang => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
