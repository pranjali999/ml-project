import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Star } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

export function MultiCropComparison({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) return null

  const chartData = rows.map((r) => ({
    name: r.crop,
    profit: Number(r.profit) || 0,
    yield: Number(r.yield) || 0,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/30 px-5 py-4 dark:border-white/10">
          <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Top crops by profit
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Same weather &amp; area — compared across staple crops (model estimates).
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div
                key={r.crop}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`relative flex items-center justify-between rounded-xl border px-4 py-3 ${
                  i === 0
                    ? 'border-amber-400/60 bg-gradient-to-r from-amber-500/15 to-orange-500/10 dark:border-amber-500/40'
                    : 'border-white/30 bg-white/30 dark:border-white/10 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500" aria-label="Best profit" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{r.crop}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Yield {r.yield} t/ha
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    INR {Number(r.profit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Profit (est.)</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="h-56 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(v) => [`INR ${Number(v).toLocaleString('en-IN')}`, 'Profit']}
                  contentStyle={{ borderRadius: 12, border: 'none' }}
                />
                <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} name="Profit (INR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
