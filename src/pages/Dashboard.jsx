import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Sidebar } from '../components/layout/Sidebar.jsx'
import { Button } from '../components/ui/Button.jsx'
import { API_BASE_URL, getApiErrorMessage, forecast, recommend, postRisk, getHealth } from '../services/api.js'

const COLORS = ['#10b981', '#0ea5e9', '#a855f7', '#f59e0b', '#64748b']

/** Probe several rainfall points to build crop recommendation comparison (API-driven). */
const RAINFALL_PROBE = [450, 700, 950, 1200, 1650]

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lineData, setLineData] = useState([])
  const [barData, setBarData] = useState([])
  const [pieData, setPieData] = useState([])
  const [metrics, setMetrics] = useState({
    trendPct: null,
    avgConfidence: null,
    riskLabel: null,
    apiOk: null,
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const health = await getHealth()
      const fc = await forecast({ periods: 12, history: null })
      const forecastPoints = fc.forecast || []
      const mappedLine = forecastPoints.map((row, i) => ({
        label:
          typeof row.ds === 'string' && row.ds.length > 12
            ? String(row.ds).slice(0, 7)
            : `P${i + 1}`,
        yield: Number(row.yhat?.toFixed?.(3) ?? row.yhat),
        lower: Number(row.yhat_lower ?? row.yhat),
        upper: Number(row.yhat_upper ?? row.yhat),
      }))
      setLineData(mappedLine)

      const firstY = mappedLine[0]?.yield
      const lastY = mappedLine[mappedLine.length - 1]?.yield
      let trendPct = null
      if (firstY && lastY) {
        trendPct = (((lastY - firstY) / firstY) * 100).toFixed(1)
      }

      const recs = await Promise.all(
        RAINFALL_PROBE.map((rainfall) =>
          recommend({
            rainfall,
            temperature: 28,
            soil: 'black',
            region: 'Maharashtra',
          }),
        ),
      )
      const bar = recs.map((r, i) => ({
        scenario: `${RAINFALL_PROBE[i]}mm`,
        confidence: Math.round((r.confidence ?? 0) * 1000) / 10,
        crop: r.recommended_crop || '—',
      }))
      setBarData(bar)

      const confAvg =
        recs.reduce((a, r) => a + (r.confidence || 0), 0) / Math.max(recs.length, 1)

      const cropCounts = {}
      recs.forEach((r) => {
        const c = r.recommended_crop || 'unknown'
        cropCounts[c] = (cropCounts[c] || 0) + (r.confidence || 1)
      })
      const pie = Object.entries(cropCounts).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      setPieData(pie)

      const riskRes = await postRisk({ rainfall: 900 })
      setMetrics({
        trendPct,
        avgConfidence: Math.round(confAvg * 1000) / 10,
        riskLabel: riskRes.risk || '—',
        apiOk: health?.ok === true,
      })
    } catch (e) {
      setError(getApiErrorMessage(e))
      setLineData([])
      setBarData([])
      setPieData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Forecast trend',
        value: metrics.trendPct != null ? `${metrics.trendPct > 0 ? '+' : ''}${metrics.trendPct}%` : '—',
        sub: 'from /forecast (yhat vs first period)',
      },
      {
        label: 'API',
        value: metrics.apiOk ? 'Connected' : '—',
        sub: API_BASE_URL,
      },
      {
        label: 'Rainfall risk (900mm)',
        value: metrics.riskLabel || '—',
        sub: 'from /risk',
      },
      {
        label: 'Avg. recommend confidence',
        value: metrics.avgConfidence != null ? `${metrics.avgConfidence}%` : '—',
        sub: 'from /recommend probes',
      },
    ],
    [metrics],
  )

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Charts load from <code className="rounded bg-white/50 px-1 dark:bg-slate-800">{API_BASE_URL}</code>
          </p>
          <Button
            type="button"
            variant="secondary"
            loading={loading}
            onClick={load}
            icon={RefreshCw}
          >
            Refresh data
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-300/50 bg-red-500/10 p-4 dark:border-red-500/30">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">Dashboard failed to load</p>
              <p className="mt-1 text-sm text-red-800/90 dark:text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card hover={false} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {m.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {loading && !m.value ? '…' : m.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Yield trend (forecast)"
              subtitle="POST /forecast — model yhat over future periods"
            />
            <div className="h-72 w-full">
              {loading && lineData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="yield"
                      name="yhat"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Recommendation confidence by rainfall"
              subtitle="POST /recommend at different rainfall levels"
            />
            <div className="h-72 w-full">
              {loading && barData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Bar dataKey="confidence" name="Confidence %" radius={[8, 8, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Recommended crop mix (weighted)"
            subtitle="Derived from /recommend responses — confidence-weighted"
          />
          <div className="h-80 w-full">
            {loading && pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
