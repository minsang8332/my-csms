import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X, Settings } from 'lucide-react'

type HeaderProps = {
  onSettingsOpen: () => void
}

export default function Header({ onSettingsOpen }: HeaderProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!window.api || !window.api.native) return

    // 초기 최대화 상태 체크
    window.api.native.isMaximized().then((max) => {
      setIsMaximized(max)
    })

    // 최대화 상태 변경 리스닝
    const unsubscribe = window.api.native.onMaximizedChange((max) => {
      setIsMaximized(max)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleMinimize = () => {
    window.api?.native?.minimize()
  }

  const handleMaximize = () => {
    window.api?.native?.maximize()
  }

  const handleClose = () => {
    window.api?.native?.close()
  }

  return (
    <header 
      className="flex h-12 w-full select-none items-center justify-between border-b border-emerald-700/50 bg-primary px-4 backdrop-blur-md transition-colors dark:border-slate-800/40"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 3. 제목 및 좌측 깜빡이 제거 */}
      <div className="flex items-center" />

      {/* 우측 컨트롤 영역 */}
      <div 
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 설정 버튼 */}
        <button
          onClick={onSettingsOpen}
          className="grid h-8 w-8 place-items-center rounded-md text-emerald-100 hover:bg-emerald-700/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-0"
          title="설정"
          type="button"
        >
          <Settings size={16} />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-emerald-700/40 dark:bg-slate-800" />

        {/* 최소화 버튼 */}
        <button
          onClick={handleMinimize}
          className="grid h-8 w-8 place-items-center rounded-md text-emerald-100 hover:bg-emerald-700/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-0"
          title="최소화"
          type="button"
        >
          <Minus size={14} />
        </button>

        {/* 최대화/이전크기 복원 버튼 */}
        <button
          onClick={handleMaximize}
          className="grid h-8 w-8 place-items-center rounded-md text-emerald-100 hover:bg-emerald-700/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-0"
          title={isMaximized ? '이전 크기로' : '최대화'}
          type="button"
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="grid h-8 w-8 place-items-center rounded-md text-emerald-100 hover:bg-rose-600 hover:text-white dark:text-slate-400 dark:hover:bg-rose-600 dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-0"
          title="닫기"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  )
}
