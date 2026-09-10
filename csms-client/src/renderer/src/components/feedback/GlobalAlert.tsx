import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useAlertStore } from '../../stores/useAlertStore'

function GlobalAlert() {
  const open = useAlertStore((state) => state.open)
  const type = useAlertStore((state) => state.type)
  const message = useAlertStore((state) => state.message)
  const hideAlert = useAlertStore((state) => state.hideAlert)

  if (!open) {
    return null
  }

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Info

  return (
    <div className="fixed right-5 top-5 z-50">
      <div className="flex min-w-72 items-center gap-3 rounded-lg border border-emerald-100/80 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl dark:border-emerald-900/60 dark:bg-slate-950/85 dark:text-slate-100">
        <Icon
          className={
            type === 'error'
              ? 'text-rose-500'
              : type === 'success'
                ? 'text-emerald-600 dark:text-emerald-300'
                : 'text-emerald-600 dark:text-emerald-300'
          }
          size={18}
        />
        <div className="min-w-0 flex-1">{message}</div>
        <button
          aria-label="Close alert"
          className="grid h-7 w-7 place-items-center rounded text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
          type="button"
          onClick={hideAlert}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

export default GlobalAlert
