import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, Filter } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Select } from '../components/ui/Select.jsx'
import { useHistory } from '../context/HistoryContext.jsx'
import { CROPS, INDIAN_STATES } from '../utils/constants.js'
import { getApiErrorMessage, getDefaultUserId, history as fetchHistory } from '../services/api.js'

function mapServerDoc(doc) {
  const inp = doc.input || {}
  const pred = doc.prediction || {}
  return {
    id: `srv-${doc.prediction_id || doc._id}`,
    createdAt: doc.created_at || new Date().toISOString(),
    form: {
      state: inp.state,
      crop: inp.crop,
      season: inp.season,
      rainfall: inp.rainfall,
      area: inp.area,
    },
    result: {
      yield: pred.yield,
      recommended_crop: pred.recommended_crop,
      profit: pred.profit,
      risk: pred.risk,
      detail: pred.detail,
      predictedYield: pred.yield,
      riskLevel: pred.risk,
    },
    source: 'server',
  }
}

function HistoryCard({ row, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.4) }}
    >
      <Card float className="h-full p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {new Date(row.createdAt).toLocaleString()}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
              {row.form?.crop || '—'} · {row.form?.state || '—'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {row.source === 'server' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:text-violet-200">
                <Cloud className="h-3 w-3" />
                Server
              </span>
            )}
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200">
              {row.result?.risk ?? row.result?.riskLevel ?? '—'} risk
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Season</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{row.form?.season}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rainfall</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {row.form?.rainfall} mm
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Yield</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {row.result?.yield ?? row.result?.predictedYield}{' '}
              {row.result?.detail?.yield_unit
                ? String(row.result.detail.yield_unit).replace(/_/g, ' ')
                : row.result?.unit || ''}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Profit (est.)</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              INR {Number(row.result?.profit ?? 0).toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>
      </Card>
    </motion.div>
  )
}

export default function History() {
  const { items } = useHistory()
  const [stateFilter, setStateFilter] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [serverRows, setServerRows] = useState([])
  const [serverNote, setServerNote] = useState(null)

  useEffect(() => {
    fetchHistory({ userId: getDefaultUserId(), limit: 40 })
      .then((r) => {
        if (r.ok && Array.isArray(r.items) && r.items.length) {
          setServerRows(r.items.map(mapServerDoc))
        }
      })
      .catch((e) => {
        setServerNote(getApiErrorMessage(e))
      })
  }, [])

  const filtered = useMemo(() => {
    return items.filter((row) => {
      const s = row.form?.state || ''
      const c = row.form?.crop || ''
      if (stateFilter && s !== stateFilter) return false
      if (cropFilter && c !== cropFilter) return false
      return true
    })
  }, [items, stateFilter, cropFilter])

  const filteredServer = useMemo(() => {
    return serverRows.filter((row) => {
      const s = row.form?.state || ''
      const c = row.form?.crop || ''
      if (stateFilter && s !== stateFilter) return false
      if (cropFilter && c !== cropFilter) return false
      return true
    })
  }, [serverRows, stateFilter, cropFilter])

  const hasAny = filtered.length > 0 || filteredServer.length > 0

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Prediction history"
          subtitle="Local runs in this browser; when MongoDB is enabled, matching server history appears below."
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              <Filter className="h-3.5 w-3.5" />
              {filtered.length + filteredServer.length} shown
            </span>
          }
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Filter by state"
            value={stateFilter || 'All'}
            onChange={(e) => setStateFilter(e.target.value === 'All' ? '' : e.target.value)}
            options={['All', ...INDIAN_STATES]}
          />
          <Select
            label="Filter by crop"
            value={cropFilter || 'All'}
            onChange={(e) => setCropFilter(e.target.value === 'All' ? '' : e.target.value)}
            options={['All', ...CROPS]}
          />
        </div>
        {serverNote && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            Could not load server history: {serverNote}
          </p>
        )}
      </Card>

      {!hasAny && (
        <Card className="p-10 text-center text-slate-600 dark:text-slate-400">
          No predictions yet — run one from the Prediction page.
        </Card>
      )}

      {filtered.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">This device</p>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((row, i) => (
              <HistoryCard key={row.id} row={row} i={i} />
            ))}
          </div>
        </div>
      )}

      {filteredServer.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Cloud className="h-4 w-4" />
            Synced from API (POST /history)
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredServer.map((row, i) => (
              <HistoryCard key={row.id} row={row} i={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
