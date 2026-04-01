import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35',
  secondary:
    'glass text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10',
  ghost: 'bg-transparent hover:bg-white/20 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200',
  danger: 'bg-red-500/90 text-white hover:bg-red-600',
}

export const Button = forwardRef(function Button(
  {
    className = '',
    variant = 'primary',
    children,
    loading,
    disabled,
    icon: Icon,
    ...props
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold
        transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-emerald-500 disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant] || variants.primary}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {!loading && Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </motion.button>
  )
})
