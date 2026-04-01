import { forwardRef } from 'react'

export const Select = forwardRef(function Select(
  { label, options, placeholder, className = '', id, ...props },
  ref,
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label className="block w-full" htmlFor={selectId}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full appearance-none rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 pr-10 text-sm
            text-slate-900 shadow-inner shadow-slate-200/40 outline-none transition
            focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20
            dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:shadow-none
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === 'object' && opt != null ? opt.value : opt
            const label = typeof opt === 'object' && opt != null ? opt.label : opt
            return (
              <option key={String(value)} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </label>
  )
})
