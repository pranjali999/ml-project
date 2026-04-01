import { motion } from 'framer-motion'
import { Gauge } from 'lucide-react'

export function confidenceTier(p) {
  const x = typeof p === 'number' ? p : 0
  if (x >= 0.75) return { label: 'High', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/30' }
  if (x >= 0.45) return { label: 'Medium', bar: 'bg-amber-400', text: 'text-amber-800 dark:text-amber-200', ring: 'ring-amber-400/30' }
  return { label: 'Low', bar: 'bg-rose-500', text: 'text-rose-800 dark:text-rose-200', ring: 'ring-rose-500/30' }
}

export function ConfidenceBar({ value }) {
  const p = Math.max(0, Math.min(1, Number(value) || 0))
  const pct = Math.round(p * 100)
  const tier = confidenceTier(p)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/40 bg-white/50 p-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 ${tier.ring} ring-2`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className={`h-5 w-5 ${tier.text}`} aria-hidden />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Model confidence</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tier.text} bg-white/80 dark:bg-slate-800/80`}>
          {tier.label}
        </span>
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className={`font-display text-2xl font-bold ${tier.text}`}>{pct}%</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Combined yield + crop</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
        <motion.div
          className={`h-full rounded-full ${tier.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </motion.div>
  )
}
