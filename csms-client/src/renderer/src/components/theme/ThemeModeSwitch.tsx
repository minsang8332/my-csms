import { Moon, Monitor, Sun } from 'lucide-react'
import { useThemeStore, type ThemeMode } from '../../stores/useThemeStore'

const modes: Array<{
  label: string
  value: ThemeMode
  Icon: typeof Monitor
}> = [
  { label: '시스템 설정', value: 'system', Icon: Monitor },
  { label: '라이트 모드', value: 'light', Icon: Sun },
  { label: '다크 모드', value: 'dark', Icon: Moon }
]

function ThemeModeSwitch() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <div 
      className="fixed bottom-5 right-5 z-40 flex items-center rounded-full border border-emerald-700/50 bg-emerald-950/80 p-1.5 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/80 hover:scale-105"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {modes.map(({ label, value, Icon }) => (
        <button
          key={value}
          aria-label={label}
          title={label}
          className={[
            'grid h-8 w-8 place-items-center rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-0 cursor-pointer',
            mode === value
              ? 'bg-emerald-500 text-white shadow-md dark:bg-emerald-400 dark:text-slate-950'
              : 'text-emerald-200 hover:text-white dark:text-slate-400 dark:hover:text-slate-100'
          ].join(' ')}
          type="button"
          onClick={() => setMode(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}

export default ThemeModeSwitch
