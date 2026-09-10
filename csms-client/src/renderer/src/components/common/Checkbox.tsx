import React from 'react'
import { Check } from 'lucide-react'

type CheckboxProps = {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}: CheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Hidden checkbox for accessibility */}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Glassmorphism custom design container */}
      <div
        className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-all duration-300 relative overflow-hidden shrink-0
          ${
            checked
              ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)] dark:bg-emerald-400/10'
              : 'bg-white/10 dark:bg-slate-950/30 border-emerald-100/60 dark:border-slate-800/80 hover:border-emerald-500/60 dark:hover:border-emerald-500/40 hover:bg-white/20 dark:hover:bg-slate-950/50'
          }
          border backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
          group-active:scale-90
        `}
      >
        {/* Glow effect on hover */}
        <span
          className={`absolute inset-0 bg-emerald-400/10 transition-opacity duration-300 rounded-md opacity-0 group-hover:opacity-100`}
        />

        {/* Animated Check Icon */}
        <Check
          className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-all duration-300 transform relative z-10
            ${checked ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-12 opacity-0'}
          `}
          strokeWidth={3.5}
        />
      </div>

      {/* Label Text */}
      {label && (
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {label}
        </span>
      )}
    </label>
  )
}

