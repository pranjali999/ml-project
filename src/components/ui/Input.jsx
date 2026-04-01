import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { label, hint, error, className = '', id, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label className="block w-full" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm text-slate-900
          shadow-inner shadow-slate-200/40 outline-none transition
          placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20
          dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:shadow-none dark:placeholder:text-slate-500
          ${error ? 'border-red-400 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
})
