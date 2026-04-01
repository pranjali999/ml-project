import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Lightbulb, Sparkles } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

const COLORS = ['#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#f59e0b']

export function FeatureShapPanel({ featureImportance, topFactor, shapPlotBase64, explanationText }) {
  const entries = featureImportance && typeof featureImportance === 'object'
    ? Object.entries(featureImportance)
    : []
  const chartData = entries.map(([name, v]) => ({
    name: String(name).replace(/_/g, ' '),
    value: Number(v) || 0,
  }))

  const insight = explanationText?.trim() || null

  if (chartData.length === 0 && !shapPlotBase64 && !insight) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="space-y-4"
    >
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
          <div>
            <p className="font-display font-semibold text-slate-900 dark:text-white">
              Explainability (SHAP)
            </p>
            {topFactor && !insight && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {String(topFactor).replace(/_/g, ' ')}
                </span>{' '}
                had the highest impact on this yield prediction (normalized contribution).
              </p>
            )}
          </div>
        </div>
        {chartData.length > 0 && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, 'Share']}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {insight && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className={`mt-4 flex gap-3 rounded-2xl border px-4 py-3 ${
              chartData.length > 0 ? 'border-violet-400/40 bg-violet-500/10 dark:border-violet-500/30 dark:bg-violet-950/40' : ''
            } ${!chartData.length ? 'border-emerald-400/40 bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-950/30' : ''}`}
          >
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
            <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
              {insight}
            </p>
          </motion.div>
        )}
        {shapPlotBase64 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/30 bg-slate-900/5 dark:bg-white/5">
            <img
              src={`data:image/png;base64,${shapPlotBase64}`}
              alt="SHAP summary"
              className="h-auto w-full max-h-80 object-contain"
            />
            <p className="border-t border-white/20 px-3 py-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Server-generated SHAP bar chart (optional)
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
