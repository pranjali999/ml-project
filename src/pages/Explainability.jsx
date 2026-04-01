import { useCallback, useEffect, useState } from 'react'
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
import { AlertCircle, Lightbulb, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { usePredictionForm } from '../context/PredictionContext.jsx'
import { getApiErrorMessage, explain } from '../services/api.js'

const BAR_COLORS = ['#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#f59e0b']

export default function Explainability() {
  const { form } = usePredictionForm()
  const [chartData, setChartData] = useState([])
  const [summary, setSummary] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [topFactor, setTopFactor] = useState('')
  const [fiEntries, setFiEntries] = useState([])
  const [explanationText, setExplanationText] = useState('')

  const load = useCallback(async () => {
    if (!form.state || !form.crop || !form.season) {
      setError('Set state, crop, and season on the Prediction page first.')
      setChartData([])
      setFiEntries([])
      setTopFactor('')
      setExplanationText('')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await explain({
        state: form.state,
        crop: form.crop,
        season: form.season,
        rainfall: Number(form.rainfall),
        temperature: Number(form.temperature),
        area: Number(form.area),
      })
      const ranked = data.shap_ranking || []
      setChartData(
        ranked.map((r) => ({
          name: String(r.feature).replace(/_/g, ' '),
          value: Math.abs(Number(r.shap_value)),
          raw: Number(r.shap_value),
        })),
      )
      setSummary(data.summary || '')
      setPrediction(data.prediction)
      setTopFactor(data.top_factor || '')
      setExplanationText(data.explanation_text || '')
      const fi = data.feature_importance
      if (fi && typeof fi === 'object') {
        setFiEntries(
          Object.entries(fi).map(([name, v]) => ({
            name: String(name).replace(/_/g, ' '),
            value: Number(v) || 0,
          })),
        )
      } else {
        setFiEntries([])
      }
    } catch (e) {
      setError(getApiErrorMessage(e))
      setChartData([])
      setFiEntries([])
      setTopFactor('')
      setExplanationText('')
    } finally {
      setLoading(false)
    }
  }, [
    form.state,
    form.crop,
    form.season,
    form.rainfall,
    form.temperature,
    form.area,
  ])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardHeader
            title="Feature importance"
            subtitle="POST /explain — uses the same inputs as the Prediction form"
          />
          <Button type="button" variant="secondary" loading={loading} onClick={load} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-red-800 dark:border-red-500/30 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="h-80 w-full">
          {loading && chartData.length === 0 && fiEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
              Loading explainability…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fiEntries.length ? fiEntries : chartData}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  }}
                  formatter={(v, _n, props) => [
                    fiEntries.length
                      ? `Share ${(Number(v) * 100).toFixed(1)}%`
                      : `|SHAP| ${v} (raw ${props.payload.raw?.toFixed?.(4) ?? props.payload.raw})`,
                    'effect',
                  ]}
                />
                <Bar dataKey="value" name="|SHAP|" radius={[0, 8, 8, 0]} barSize={22}>
                  {(fiEntries.length ? fiEntries : chartData).map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/30 px-6 py-4 dark:border-white/10">
            <CardHeader title="Model output" subtitle="Predicted yield from the same explainer call" />
          </div>
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            className="relative flex min-h-[200px] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-8 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/50"
          >
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Predicted yield</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
                {prediction != null ? `${prediction}` : loading ? '…' : '—'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">tonnes per hectare (approx.)</p>
            </div>
          </motion.div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Narrative explanation" />
          {explanationText && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex gap-3 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm font-medium text-slate-800 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-slate-100"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
              {explanationText}
            </motion.div>
          )}
          {topFactor && !explanationText && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>
                Top driver: <strong className="capitalize">{String(topFactor).replace(/_/g, ' ')}</strong>
              </span>
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg leading-relaxed text-slate-700 dark:text-slate-300"
          >
            {summary || 'Adjust inputs on the Prediction page, then return here.'}
          </motion.p>
        </Card>
      </div>
    </div>
  )
}
