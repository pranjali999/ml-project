import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X, Sprout, Wallet, AlertTriangle, Wheat, TrendingUp } from 'lucide-react'
import {
  formatDecisionSummaryLine,
  formatMinutesAgo,
  formatProfitInr,
  formatYieldLine,
  shortSoilDisplayName,
  uiRainTag,
  uiSoilTag,
  uiTempTag,
} from '../../utils/mapUxLabels.js'
import { SustainabilityInsights } from '../prediction/SustainabilityInsights.jsx'

function DataFreshness({ timestampMs }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (timestampMs == null) return undefined
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [timestampMs])
  if (timestampMs == null) return null
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400">
      ⏱ Data updated {formatMinutesAgo(timestampMs)}
    </p>
  )
}

export function MapPredictionPanel({
  open,
  onClose,
  loading,
  error,
  result,
  stateName,
  payload,
  envSnapshot,
  onViewFull,
}) {
  const ds = result?.data_source
  const backendWeather = ds?.weather
  const backendSoil = ds?.soil

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
            aria-label="Close panel"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[2001] flex h-full w-full max-w-md flex-col border-l border-white/30 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95"
          >
            <div className="flex items-center justify-between border-b border-white/30 px-4 py-3 dark:border-white/10">
              <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Map prediction
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 hover:bg-white/60 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {stateName && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {stateName}
                </motion.p>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600 dark:text-slate-300"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" aria-hidden />
                  <p className="text-sm font-medium">⏳ Fetching real-time data…</p>
                </motion.div>
              )}

              {!loading && error && (
                <div className="space-y-3">
                  {envSnapshot && (
                    <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-slate-800 dark:border-sky-500/25 dark:bg-sky-950/40 dark:text-sky-50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-100">
                        Environment used (live / fallback)
                      </p>
                      <p className="mt-2 text-slate-700 dark:text-slate-200">
                        🌡 {typeof envSnapshot.temperature === 'number' ? `${envSnapshot.temperature.toFixed(1)}°C` : '—'}{' '}
                        · 🌧{' '}
                        {typeof envSnapshot.rainfallMm === 'number'
                          ? `${envSnapshot.rainfallMm.toFixed(1)} mm`
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {envSnapshot.soilLabel} ({envSnapshot.soilSource})
                      </p>
                    </div>
                  )}
                  <div
                    className="rounded-2xl border border-red-300/60 bg-red-500/10 p-4 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                  >
                    <p className="font-semibold">Unable to fetch prediction</p>
                    <p className="mt-2 text-red-800/90 dark:text-red-200/90">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <DataFreshness timestampMs={result.data_timestamp} />

                  {envSnapshot && (
                    <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-slate-800 dark:border-sky-500/25 dark:bg-sky-950/40 dark:text-sky-50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-100">
                        Inputs
                      </p>
                      {envSnapshot.lat != null && envSnapshot.lng != null && (
                        <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                          📍 {Number(envSnapshot.lat).toFixed(2)}, {Number(envSnapshot.lng).toFixed(2)}
                        </p>
                      )}
                      <div className="mt-2 space-y-1 text-sm text-slate-800 dark:text-slate-100">
                        <p>
                          🌡 Temperature:{' '}
                          {typeof envSnapshot.temperature === 'number'
                            ? `${envSnapshot.temperature.toFixed(1)}°C`
                            : '—'}{' '}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({uiTempTag(envSnapshot.weatherSource)})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Source: {backendWeather ?? 'Open-Meteo'}
                        </p>
                        <p>
                          🌧 Rainfall:{' '}
                          {typeof envSnapshot.rainfallMm === 'number'
                            ? `${envSnapshot.rainfallMm.toFixed(1)} mm`
                            : '—'}{' '}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({uiRainTag(envSnapshot.weatherSource)})
                          </span>
                        </p>
                        <p>
                          🌱 Soil: {shortSoilDisplayName(envSnapshot)}{' '}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({uiSoilTag(envSnapshot.soilSource)})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Source: {backendSoil ?? 'ISRIC SoilGrids'}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200">
                          📅 Season: {envSnapshot.seasonDisplayLabel || envSnapshot.season}{' '}
                          <span className="text-xs text-slate-500">(System derived)</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 dark:border-emerald-500/20">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                      <Sprout className="h-4 w-4" aria-hidden />
                      Yield
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                      {formatYieldLine(result)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 dark:border-amber-500/20">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-100">
                      <Wallet className="h-4 w-4" aria-hidden />
                      Profit (est.)
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                      {formatProfitInr(result.profit)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 dark:border-rose-500/20">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-900 dark:text-rose-100">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Risk
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                      {result.risk ?? '—'}
                    </p>
                  </div>
                  {result.confidence != null && (
                    <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 dark:border-violet-500/20">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-900 dark:text-violet-100">
                        <TrendingUp className="h-4 w-4" aria-hidden />
                        Confidence
                      </p>
                      <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                        {Number(result.confidence) <= 1
                          ? `${Math.round(Number(result.confidence) * 100)}%`
                          : `${Math.round(Number(result.confidence))}%`}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/30 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Wheat className="h-4 w-4" aria-hidden />
                      Recommended crop
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {result.recommended_crop ?? '—'}
                    </p>
                  </div>
                  {formatDecisionSummaryLine(result.decision_summary) && (
                    <div className="rounded-2xl border border-white/30 bg-white/40 p-4 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200">
                      {formatDecisionSummaryLine(result.decision_summary)}
                    </div>
                  )}
                  <SustainabilityInsights result={result} compact />
                  <button
                    type="button"
                    onClick={onViewFull}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-95"
                  >
                    View full prediction
                  </button>
                  {payload && (
                    <p className="text-center text-[10px] text-slate-500 dark:text-slate-400">
                      Inputs: {payload.crop}, {payload.season}, {payload.rainfall} mm rain,{' '}
                      {payload.temperature}°C, {payload.area} ha
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
