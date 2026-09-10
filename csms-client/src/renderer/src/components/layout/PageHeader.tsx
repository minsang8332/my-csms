import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subLabel?: string | null
  action?: ReactNode
}

export default function PageHeader({ title, subLabel, action }: PageHeaderProps) {
  return (
    <div className="glass-panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-emerald-950 dark:text-emerald-100">
            {title}
          </h1>
          {subLabel && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {subLabel}
            </p>
          )}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  )
}
