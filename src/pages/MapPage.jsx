import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Sparkles } from 'lucide-react'
import { IndiaMap } from '../components/map/IndiaMap.jsx'
import { MapLegend } from '../components/map/MapLegend.jsx'
import { MapPredictionPanel } from '../components/map/MapPredictionPanel.jsx'
import { INDIAN_STATES } from '../utils/constants.js'
import { getStateProfile } from '../utils/mapHelpers.js'
import {
  buildProfileOnlyEnvironment,
  buildRealtimeEnvironment,
  resolveCoordinates,
} from '../utils/realtimeContext.js'
import { createRealtimeCache } from '../utils/realtimeCache.js'
import { predict, buildRealtimePredictPayload, getApiErrorMessage } from '../services/api.js'
import {
  buildPopupLoadingHtml,
  buildPredictionErrorHtml,
  buildPredictionPopupHtml,
  wireMapPredictionPopupButton,
} from '../utils/mapPredictionHtml.js'

export default function MapPage() {
  const navigate = useNavigate()
  const cacheRef = useRef(null)
  if (!cacheRef.current) cacheRef.current = createRealtimeCache()
  const lastWeatherRef = useRef(null)
  const lastPredictContextRef = useRef(null)
  const mapLoadingRef = useRef(false)
  const panelRefreshRef = useRef(async () => {})
  /** Full-screen spinner only for quick-select (panel); map clicks use popup loading. */
  const overlayModeRef = useRef('panel')

  const [heatmap, setHeatmap] = useState(true)
  const [mapLoading, setMapLoading] = useState(false)
  const [regionError, setRegionError] = useState(null)
  const [mapError, setMapError] = useState(null)
  const [mapResult, setMapResult] = useState(null)
  const [lastPayload, setLastPayload] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [envSnapshot, setEnvSnapshot] = useState(null)

  const navigateFullPrediction = useCallback(
    (payload, env) => {
      if (!payload) return
      const profile = getStateProfile(payload.state)
      navigate('/prediction', {
        state: {
          selectedState: payload.state,
          prefill: {
            state: payload.state,
            crop: payload.crop,
            season: payload.season,
            rainfall: payload.rainfall,
            temperature: payload.temperature,
            area: payload.area,
            soil: payload.soil,
          },
          mapRegionInfo: {
            crops: profile.crops,
            avgRainfallMm: profile.avgRainfallMm,
            fromMapQuickPredict: true,
            realtimeSnapshot: env ?? null,
          },
        },
      })
    },
    [navigate],
  )

  const runPredictionForState = useCallback(
    async (appState, layer, latlng) => {
      setRegionError(null)
      setMapError(null)
      setSelectedState(appState)
      if (layer) {
        setPanelOpen(false)
      } else {
        setPanelOpen(true)
      }
      setMapResult(null)
      setLastPayload(null)
      setEnvSnapshot(null)
      lastPredictContextRef.current = null

      overlayModeRef.current = layer ? 'map' : 'panel'
      mapLoadingRef.current = true
      setMapLoading(true)

      if (layer) {
        layer.bindPopup(
          buildPopupLoadingHtml(appState, latlng?.lat, latlng?.lng),
          { maxWidth: 320, className: 'map-pred-popup leaflet-popup-smooth' },
        )
        layer.openPopup()
      }

      try {
        const profile = getStateProfile(appState)
        const coords = await resolveCoordinates(appState, latlng)
        let env
        if (!coords) {
          env = buildProfileOnlyEnvironment(appState)
        } else {
          env = await buildRealtimeEnvironment(
            appState,
            coords.lat,
            coords.lon,
            profile,
            cacheRef.current,
            lastWeatherRef,
          )
        }
        setEnvSnapshot(env)

        if (coords) {
          lastPredictContextRef.current = {
            appState,
            lat: coords.lat,
            lon: coords.lon,
            profile,
          }
        }

        const payload = buildRealtimePredictPayload({
          stateName: appState,
          temperature: env.temperature,
          rainfallMm: env.rainfallMm,
          soil: env.soilBackend,
          season: env.season,
          envSnapshot: env,
        })

        const res = await predict(payload)
        if (!res?.ok) throw new Error(typeof res?.error === 'string' ? res.error : 'Prediction failed')

        setMapResult(res)
        setLastPayload(payload)

        if (layer) {
          const html = buildPredictionPopupHtml(appState, res, payload, env)
          layer.bindPopup(html, { maxWidth: 340, className: 'map-pred-popup leaflet-popup-smooth' })
          layer.openPopup()
          wireMapPredictionPopupButton(layer, () => navigateFullPrediction(payload, env))
        }
      } catch (err) {
        const msg = getApiErrorMessage(err)
        setMapError(msg)
        setMapResult(null)
        if (layer) {
          const html = buildPredictionErrorHtml(msg)
          layer.bindPopup(html, { maxWidth: 320, className: 'map-pred-popup leaflet-popup-smooth' })
          layer.openPopup()
        }
      } finally {
        mapLoadingRef.current = false
        setMapLoading(false)
      }
    },
    [navigateFullPrediction],
  )

  panelRefreshRef.current = async () => {
    const ctx = lastPredictContextRef.current
    if (!ctx?.lat || !ctx?.lon || !panelOpen) return
    if (mapLoadingRef.current) return
    mapLoadingRef.current = true
    setMapLoading(true)
    try {
      cacheRef.current.invalidate(ctx.lat, ctx.lon)
      const env = await buildRealtimeEnvironment(
        ctx.appState,
        ctx.lat,
        ctx.lon,
        ctx.profile,
        cacheRef.current,
        lastWeatherRef,
        { bypassCache: true },
      )
      setEnvSnapshot(env)
      const payload = buildRealtimePredictPayload({
        stateName: ctx.appState,
        temperature: env.temperature,
        rainfallMm: env.rainfallMm,
        soil: env.soilBackend,
        season: env.season,
        envSnapshot: env,
      })
      const res = await predict(payload)
      if (res?.ok) {
        setMapResult(res)
        setLastPayload(payload)
      }
    } catch {
      /* silent — background refresh */
    } finally {
      mapLoadingRef.current = false
      setMapLoading(false)
    }
  }

  useEffect(() => {
    if (!panelOpen) return
    const id = window.setInterval(() => {
      panelRefreshRef.current()
    }, 600_000)
    return () => window.clearInterval(id)
  }, [panelOpen])

  const handleMapStateClick = useCallback(
    ({ appState, layer, lat, lng }) => {
      const latlng =
        typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
      runPredictionForState(appState, layer, latlng)
    },
    [runPredictionForState],
  )

  const onUnsupportedRegion = useCallback(() => {
    setRegionError(
      'This region is not mapped to a supported state in the prediction form. Pick a state from the list below.',
    )
  }, [])

  const handleQuickSelect = useCallback(
    (appState) => {
      runPredictionForState(appState, null, null)
    },
    [runPredictionForState],
  )

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const showMapOverlay = mapLoading && overlayModeRef.current === 'panel'

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/30 bg-gradient-to-br from-emerald-500/10 via-white/40 to-sky-500/10 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:from-emerald-950/30 dark:via-slate-900/50 dark:to-sky-950/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Live intelligence map
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Select Your Region
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Transparent sources: Open-Meteo (weather), ISRIC SoilGrids (soil, when available), calendar
            season. The side panel auto-refreshes every 10 minutes while open. Map fill reflects model
            confidence after each prediction.
          </p>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-400 text-emerald-600"
              checked={heatmap}
              onChange={(e) => setHeatmap(e.target.checked)}
            />
            Heatmap (demo yield)
          </label>
        </div>
      </motion.div>

      <div className="relative">
        <div className="glass pointer-events-none absolute left-4 right-4 top-4 z-[400] mx-auto max-w-xl rounded-2xl border border-white/40 bg-white/55 px-4 py-3 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:left-auto sm:right-auto sm:mx-0 sm:text-left">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Click a state — live inputs + POST /predict (data sources in response)
          </p>
          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
            Popup shows loading first, then results. Confidence tints the selected state.
          </p>
        </div>

        <div className="relative">
          {showMapOverlay && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900/35 backdrop-blur-[2px]">
              <Loader2 className="h-11 w-11 animate-spin text-white drop-shadow-md" aria-hidden />
              <p className="text-sm font-semibold text-white drop-shadow">Fetching live data &amp; prediction…</p>
            </div>
          )}
          <IndiaMap
            heatmapEnabled={heatmap}
            selectedState={selectedState}
            selectedConfidence={mapResult?.confidence ?? null}
            onStateClick={handleMapStateClick}
            onUnsupportedRegion={onUnsupportedRegion}
          />
          <MapLegend visible={heatmap} />
        </div>
      </div>

      <MapPredictionPanel
        open={panelOpen}
        onClose={closePanel}
        loading={mapLoading}
        error={mapError}
        result={mapResult}
        stateName={selectedState}
        payload={lastPayload}
        envSnapshot={envSnapshot}
        onViewFull={() => lastPayload && navigateFullPrediction(lastPayload, envSnapshot)}
      />

      {regionError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>{regionError}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Quick select state (side panel + auto-refresh)
        </p>
        <div className="flex flex-wrap gap-2">
          {INDIAN_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleQuickSelect(s)}
              disabled={mapLoading}
              className="rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-emerald-500/15 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
