import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

/**
 * Highlight recommended crop name (case-insensitive) in a line of text.
 */
function LineWithCrop({ line, cropName }) {
  if (!line || !cropName) {
    return <span>{line}</span>
  }
  const lowerLine = line.toLowerCase()
  const lowerCrop = cropName.toLowerCase().trim()
  const idx = lowerLine.indexOf(lowerCrop)
  if (idx === -1) {
    return <span>{line}</span>
  }
  const before = line.slice(0, idx)
  const match = line.slice(idx, idx + lowerCrop.length)
  const after = line.slice(idx + lowerCrop.length)
  return (
    <span>
      {before}
      <strong className="font-bold text-emerald-800 dark:text-emerald-200">{match}</strong>
      {after}
    </span>
  )
}

export function DecisionSummaryCard({ summary, recommendedCrop, isLoss, confidence }) {
  if (!summary || typeof summary !== 'string') return null

  const lines = summary.split('\n').filter(Boolean)
  const crop = recommendedCrop || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <Card
        className={`overflow-hidden border-2 p-0 shadow-xl backdrop-blur-xl ${
          isLoss
            ? 'border-rose-300/60 bg-gradient-to-br from-rose-50/95 to-orange-50/40 dark:border-rose-500/35 dark:from-rose-950/50 dark:to-slate-900/80'
            : 'border-emerald-300/50 bg-gradient-to-br from-emerald-50/95 to-teal-50/50 dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-slate-900/80'
        }`}
      >
        <div
          className={`border-b px-5 py-3 ${
            isLoss
              ? 'border-rose-200/60 bg-rose-500/10 dark:border-rose-500/20 dark:bg-rose-950/30'
              : 'border-emerald-200/60 bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-950/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              AI Decision Summary
            </h3>
          </div>
          {confidence != null && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Blended model confidence:{' '}
              <strong>{Math.round(Number(confidence) * 100)}%</strong>
            </p>
          )}
        </div>
        <div className="space-y-3 px-5 py-4">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`text-sm leading-relaxed sm:text-[15px] ${
                isLoss && line.startsWith('⚠️')
                  ? 'text-rose-900 dark:text-rose-100'
                  : line.startsWith('✅')
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-slate-800 dark:text-slate-200'
              }`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {i === 0 ? <LineWithCrop line={line} cropName={crop} /> : line}
            </motion.p>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
