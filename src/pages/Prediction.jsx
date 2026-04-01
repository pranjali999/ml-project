import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  Timer,
  Wallet,
  Wheat,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { usePredictionForm } from '../context/PredictionContext.jsx'
import { CROPS, INDIAN_STATES, SEASONS, SOIL_TYPES } from '../utils/constants.js'
import { normalizeStateForForm } from '../utils/mapHelpers.js'
import { parseVoiceToForm } from '../utils/parseVoiceToForm.js'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { useHistory } from '../context/HistoryContext.jsx'
import {
  API_BASE_URL,
  getApiErrorMessage,
  predict,
  saveHistory,
  getDefaultUserId,
} from '../services/api.js'
import { ConfidenceBar } from '../components/prediction/ConfidenceBar.jsx'
import { MultiCropComparison } from '../components/prediction/MultiCropComparison.jsx'
import { FeatureShapPanel } from '../components/prediction/FeatureShapPanel.jsx'
import { DecisionSummaryCard } from '../components/prediction/DecisionSummaryCard.jsx'
import { SustainabilityInsights } from '../components/prediction/SustainabilityInsights.jsx'

function normalizePredictionForHistory(apiData) {
  const d = apiData.detail || {}
  return {
    ...apiData,
    predictedYield: apiData.yield,
    unit: d.yield_unit || 'tonnes_per_hectare',
    recommendedCrop: apiData.recommended_crop,
    riskLevel: apiData.risk,
    riskScore: d.risk_score,
    currency: d.profit_detail?.currency || 'INR',
    profit: apiData.profit,
    confidence: apiData.confidence,
    topCrops: apiData.top_crops,
    profitability: apiData.profitability,
    modelUsed: apiData.model_used,
    decisionSummary: apiData.decision_summary,
    residue_per_hectare: apiData.residue_per_hectare,
    residue_generated: apiData.residue_generated,
    co2_per_hectare: apiData.co2_per_hectare,
    co2_emission: apiData.co2_emission,
    pm25_per_hectare: apiData.pm25_per_hectare,
    pm25_emission: apiData.pm25_emission,
    impact_message: apiData.impact_message,
    emission_reduction_percent: apiData.emission_reduction_percent,
    co2_saved: apiData.co2_saved,
    waste_solutions: apiData.waste_solutions,
    sustainability_source: apiData.sustainability_source,
  }
}

export default function Prediction() {
  const { form, updateField, setFormValues } = usePredictionForm()
  const location = useLocation()
  const { addEntry } = useHistory()
  const [includeShapPlot, setIncludeShapPlot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mapRegionBanner, setMapRegionBanner] = useState(null)
  const { listening, transcript, error: speechErr, start, stop, supported } =
    useSpeechRecognition()

  useEffect(() => {
    const s = location.state
    if (!s) return
    const prefill = { ...(s.prefill || {}) }
    if (typeof s.selectedState === 'string' && s.selectedState) {
      const normalized = normalizeStateForForm(s.selectedState) || s.selectedState
      if (!prefill.state) prefill.state = normalized
    }
    if (Object.keys(prefill).length) {
      setFormValues(prefill)
    }
    if (s.mapRegionInfo) {
      setMapRegionBanner(s.mapRegionInfo)
    }
  }, [location.state, setFormValues])

  useEffect(() => {
    if (listening) return
    if (!transcript) return
    const parsed = parseVoiceToForm(transcript)
    if (Object.keys(parsed).length) setFormValues(parsed)
  }, [listening, transcript, setFormValues])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const payload = {
        state: form.state,
        crop: form.crop,
        season: form.season,
        soil: form.soil ? String(form.soil).toLowerCase() : 'unknown',
        rainfall: Number(form.rainfall),
        temperature: Number(form.temperature),
        area: Number(form.area),
        region: form.state,
        voice_text: transcript?.trim() || undefined,
        include_shap_plot: includeShapPlot,
      }
      const data = await predict(payload)
      if (!data.ok) {
        setError(data.error || 'Prediction failed')
        return
      }
      setResult(data)
      addEntry({
        form: { ...form },
        result: normalizePredictionForHistory(data),
      })
      saveHistory({
        userId: getDefaultUserId(),
        input: payload,
        prediction: {
          yield: data.yield,
          recommended_crop: data.recommended_crop,
          profit: data.profit,
          risk: data.risk,
          detail: data.detail,
          suggestions: data.suggestions,
          confidence: data.confidence,
          top_crops: data.top_crops,
          decision_summary: data.decision_summary,
        },
      }).catch(() => {})
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const yieldLabel = result?.detail?.yield_unit
    ? `${result.yield} ${String(result.detail.yield_unit).replace(/_/g, ' ')}`
    : `${result?.yield ?? '—'}`

  const profitStr =
    result != null ? `INR ${Number(result.profit).toLocaleString('en-IN')}` : '—'
  const isLoss = result?.profitability === 'loss'

  const riskBadgeClass = (() => {
    const L = String(result?.risk || '').toUpperCase()
    if (L === 'LOW') return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
    if (L === 'HIGH') return 'bg-rose-500/20 text-rose-800 dark:text-rose-200'
    return 'bg-amber-500/20 text-amber-900 dark:text-amber-100'
  })()

  const fmtMetric = (n) => {
    if (typeof n !== 'number' || Number.isNaN(n)) return '—'
    return n.toFixed(2)
  }

  const yieldNum = result?.yield != null ? Number(result.yield) : NaN
  const residuePctOfYield =
    Number.isFinite(yieldNum) && yieldNum > 0 && result?.residue_per_hectare != null
      ? (result.residue_per_hectare / yieldNum) * 100
      : null
  const co2ReductionPct =
    typeof result?.emission_reduction_percent === 'number' && !Number.isNaN(result.emission_reduction_percent)
      ? Math.round(result.emission_reduction_percent)
      : 70

  return (
    <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)] xl:items-start">
      <Card className="neu-surface p-6 sm:p-8">
        <CardHeader
          title="Run a prediction"
          subtitle="Inputs are sent to the Flask API (POST /predict). Ensure the backend is running."
        />
        {mapRegionBanner && (
          <div className="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-50">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p>
                <span className="font-semibold">Region from map: </span>
                Best crops — {Array.isArray(mapRegionBanner.crops) ? mapRegionBanner.crops.join(', ') : '—'}
                {mapRegionBanner.avgRainfallMm != null && (
                  <span className="block text-xs opacity-90">
                    Avg rainfall (reference): {mapRegionBanner.avgRainfallMm} mm
                    {mapRegionBanner.weatherSource === 'open-meteo'
                      ? ' · Temperature from Open-Meteo'
                      : ''}
                  </span>
                )}
                {mapRegionBanner.realtimeSnapshot && (
                  <span className="mt-2 block text-xs opacity-90">
                    Live: {typeof mapRegionBanner.realtimeSnapshot.temperature === 'number' ? `${mapRegionBanner.realtimeSnapshot.temperature.toFixed(1)}°C` : '—'} ·{' '}
                    {typeof mapRegionBanner.realtimeSnapshot.rainfallMm === 'number' ? `${mapRegionBanner.realtimeSnapshot.rainfallMm.toFixed(1)} mm rain` : '—'} ·{' '}
                    {mapRegionBanner.realtimeSnapshot.soilLabel} ·{' '}
                    {mapRegionBanner.realtimeSnapshot.seasonDisplayLabel || mapRegionBanner.realtimeSnapshot.season}
                  </span>
                )}
              </p>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-emerald-800 underline dark:text-emerald-200"
                onClick={() => setMapRegionBanner(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="State"
              placeholder="Select state"
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
              options={INDIAN_STATES}
              required
            />
            <Select
              label="Crop"
              placeholder="Select crop"
              value={form.crop}
              onChange={(e) => updateField('crop', e.target.value)}
              options={CROPS}
              required
            />
            <Select
              label="Season"
              placeholder="Select season"
              value={form.season}
              onChange={(e) => updateField('season', e.target.value)}
              options={SEASONS}
              required
            />
            <Select
              label="Soil"
              placeholder="Soil type"
              value={form.soil}
              onChange={(e) => updateField('soil', e.target.value)}
              options={SOIL_TYPES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
            <Input
              label="Area (hectares)"
              type="number"
              min="0.1"
              step="0.1"
              value={form.area}
              onChange={(e) => updateField('area', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Rainfall (mm)
              </span>
              <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                {form.rainfall}
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={3000}
              step={10}
              value={form.rainfall}
              onChange={(e) => updateField('rainfall', Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-sky-200 to-emerald-300 accent-emerald-600 dark:from-sky-900/50 dark:to-emerald-900/50"
            />
          </div>
          <Input
            label="Temperature (°C)"
            type="number"
            step="0.1"
            value={form.temperature}
            onChange={(e) => updateField('temperature', Number(e.target.value))}
            required
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/30 bg-white/30 px-4 py-3 dark:border-white/10 dark:bg-slate-900/40">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
              checked={includeShapPlot}
              onChange={(e) => setIncludeShapPlot(e.target.checked)}
            />
            <div>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                <ImageIcon className="h-4 w-4 text-violet-500" aria-hidden />
                Include SHAP plot image (larger response)
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optional PNG from the server for the explainability section.
              </p>
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={loading} className="min-w-[160px]" icon={Sparkles}>
              {loading ? 'Predicting…' : 'Get prediction'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => (listening ? stop() : start())}
              disabled={!supported || loading}
              icon={listening ? MicOff : Mic}
              title={!supported ? 'Speech recognition not supported in this browser' : undefined}
            >
              {listening ? 'Listening…' : 'Voice input'}
            </Button>
          </div>
          {!supported && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Voice input requires a supported browser (e.g. Chrome desktop).
            </p>
          )}
          {speechErr && (
            <p className="text-xs text-red-600 dark:text-red-400">Speech error: {speechErr}</p>
          )}
          {transcript && (
            <p className="rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
              <span className="font-semibold">Heard: </span>
              {transcript}
            </p>
          )}
        </form>
      </Card>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="load"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-strong flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] p-8 text-center"
            >
              <motion.div
                className="mb-6 h-16 w-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-600"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Calling AgriMind API…
              </p>
              <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-400">
                Waiting for POST /predict from {API_BASE_URL}
              </p>
            </motion.div>
          )}
          {!loading && error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.75rem] border border-red-300/60 bg-red-500/10 p-6 text-center dark:border-red-500/40 dark:bg-red-950/30"
            >
              <AlertCircle className="mb-3 h-10 w-10 text-red-600 dark:text-red-400" />
              <p className="font-display font-semibold text-red-900 dark:text-red-200">
                Could not get prediction
              </p>
              <p className="mt-2 max-w-md text-sm text-red-800/90 dark:text-red-300/90">{error}</p>
            </motion.div>
          )}
          {!loading && !error && result && (
            <motion.div
              key="res"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {result.confidence != null && (
                <ConfidenceBar value={result.confidence} />
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 p-5 shadow-lg backdrop-blur-xl dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <span className="mr-1.5 inline" aria-hidden>
                        🌾
                      </span>
                      Predicted yield
                    </p>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {yieldLabel}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/40 bg-gradient-to-br from-sky-500/15 to-blue-500/10 p-5 shadow-lg backdrop-blur-xl dark:border-white/10"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Recommended crop
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                    {result.recommended_crop || '—'}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  className={`rounded-2xl border border-white/40 bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl dark:border-white/10 ${
                    isLoss
                      ? 'from-rose-500/20 to-orange-500/10'
                      : 'from-amber-500/15 to-orange-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <Wallet className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-amber-600" aria-hidden />
                      Profit (est.)
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isLoss ? 'bg-rose-600/20 text-rose-800 dark:text-rose-200' : 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      {isLoss ? 'Loss' : 'Profit'}
                    </span>
                  </div>
                  <p
                    className={`mt-1 font-display text-xl font-bold ${
                      isLoss ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {profitStr}
                  </p>
                  {result.detail?.profit_detail?.assumptions && (
                    <p className="mt-2 text-xs leading-snug text-slate-600 dark:text-slate-400">
                      Basis: {Object.values(result.detail.profit_detail.assumptions).join('; ')}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/40 bg-gradient-to-br from-rose-500/15 to-orange-500/10 p-5 shadow-lg backdrop-blur-xl dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-amber-600" aria-hidden />
                      Risk level
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${riskBadgeClass}`}
                    >
                      {result.risk || '—'}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                    {result.risk || '—'}
                  </p>
                  {result.detail?.risk_explanation && (
                    <p className="mt-2 text-xs leading-snug text-slate-600 dark:text-slate-400">
                      Score {result.detail?.risk_score ?? '—'}/100 — {result.detail.risk_explanation}
                    </p>
                  )}
                </motion.div>

                {result.residue_generated != null && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-white/40 bg-gradient-to-br from-lime-500/15 to-emerald-500/10 p-5 shadow-lg backdrop-blur-xl dark:border-white/10"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <span className="mr-1.5 inline" aria-hidden>
                        🌱
                      </span>
                      Residue (est.)
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-emerald-900 dark:text-emerald-100">
                      {fmtMetric(result.residue_generated)} t
                    </p>
                    <p className="mt-1 text-xs leading-snug text-slate-600 dark:text-slate-400">
                      {fmtMetric(result.residue_per_hectare)} t/ha field
                      {residuePctOfYield != null && (
                        <>
                          {' '}
                          ·{' '}
                          <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                            ≈{residuePctOfYield.toFixed(0)}%
                          </span>{' '}
                          of yield (mass)
                        </>
                      )}
                    </p>
                  </motion.div>
                )}

                {result.co2_emission != null && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-white/40 bg-gradient-to-br from-orange-500/15 to-amber-500/10 p-5 shadow-lg backdrop-blur-xl dark:border-white/10"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <span className="mr-1.5 inline" aria-hidden>
                        🔥
                      </span>
                      CO₂ if burned (est.)
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-orange-100">
                      {fmtMetric(result.co2_emission)} t
                    </p>
                    <p className="mt-1 text-xs leading-snug text-slate-600 dark:text-slate-400">
                      Up to{' '}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {co2ReductionPct}%
                      </span>{' '}
                      reducible · save ~{fmtMetric(result.co2_saved)} t CO₂
                    </p>
                  </motion.div>
                )}
              </div>

              {isLoss && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-100"
                  role="alert"
                >
                  <span className="text-lg" aria-hidden>
                    ⚠️
                  </span>
                  <span>Estimated loss at current assumptions — consider alternative crops or cost review.</span>
                </motion.div>
              )}

              {(result.model_used || result.response_time_ms != null) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
                >
                  {result.model_used && (
                    <span className="inline-flex items-center gap-1.5">
                      <Wheat className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                      Model: <strong className="text-slate-700 dark:text-slate-200">{result.model_used}</strong>
                    </span>
                  )}
                  {result.response_time_ms != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" aria-hidden />
                      Response time: <strong>{result.response_time_ms} ms</strong>
                    </span>
                  )}
                </motion.div>
              )}

              {result.decision_summary && (
                <DecisionSummaryCard
                  summary={result.decision_summary}
                  recommendedCrop={result.recommended_crop}
                  isLoss={isLoss}
                  confidence={result.confidence}
                />
              )}

              <SustainabilityInsights result={result} omitResidueCo2 />

              {Array.isArray(result.top_crops) && result.top_crops.length > 0 && (
                <MultiCropComparison rows={result.top_crops} />
              )}

              {(result.explanation_text ||
                (result.feature_importance && Object.keys(result.feature_importance).length > 0) ||
                result.detail?.shap_plot_base64) && (
                <FeatureShapPanel
                  featureImportance={result.feature_importance || {}}
                  topFactor={result.top_factor}
                  shapPlotBase64={result.detail?.shap_plot_base64}
                  explanationText={result.explanation_text}
                />
              )}

              {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Suggestions
                  </p>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
          {!loading && !error && !result && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-strong flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] p-8 text-center"
            >
              <Sparkles className="mb-4 h-10 w-10 text-emerald-500" />
              <p className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
                Your forecast will appear here
              </p>
              <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Submit the form to load results from the backend.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
