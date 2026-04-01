import { motion } from 'framer-motion'
import { YIELD_TIERS } from '../../utils/mapHelpers.js'

export function MapLegend({ visible = true }) {
  if (!visible) return null
  const rows = [
    { key: 'high', ...YIELD_TIERS.high },
    { key: 'medium', ...YIELD_TIERS.medium },
    { key: 'low', ...YIELD_TIERS.low },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-xl border border-white/40 bg-white/75 px-3 py-2.5 text-left shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Yield (demo)
      </p>
      <ul className="space-y-1.5">
        {rows.map(({ key, fill, label }) => (
          <li key={key} className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-100">
            <span
              className="h-3 w-3 shrink-0 rounded-sm border border-white/50 shadow-sm"
              style={{ backgroundColor: fill }}
              aria-hidden
            />
            {label}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
