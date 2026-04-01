import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import { motion } from 'framer-motion'
import indiaGeoUrl from '../../assets/india_states.geojson?url'
import {
  getYieldTier,
  resolveAppStateFromGeoFeature,
  YIELD_TIERS,
} from '../../utils/mapHelpers.js'

const CENTER = [22.9734, 78.6569]
const ZOOM_DESKTOP = 5
const ZOOM_MOBILE = 4

const SELECTED_BORDER = '#2563eb'
const CONF_HIGH = '#15803d'
const CONF_MED = '#ca8a04'
const CONF_LOW = '#b91c1c'

function useMobileMapZoom() {
  const [zoom, setZoom] = useState(ZOOM_DESKTOP)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setZoom(mq.matches ? ZOOM_MOBILE : ZOOM_DESKTOP)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return zoom
}

/** Normalize confidence to 0–1 if API sends 0–100 */
function confidenceToFill(confidence) {
  if (confidence == null || Number.isNaN(Number(confidence))) return null
  let c = Number(confidence)
  if (c > 1) c = c / 100
  if (c > 0.75) return CONF_HIGH
  if (c >= 0.45) return CONF_MED
  return CONF_LOW
}

function basePathStyle(feature, heatmapEnabled, selectedState, selectedConfidence) {
  const name = resolveAppStateFromGeoFeature(feature)
  const isSelected = Boolean(selectedState && name === selectedState)
  const confFill = isSelected ? confidenceToFill(selectedConfidence) : null

  if (isSelected && confFill) {
    return {
      color: '#ffffff',
      weight: 3,
      fillColor: confFill,
      fillOpacity: 0.88,
    }
  }

  if (heatmapEnabled && name) {
    const tier = getYieldTier(name)
    const fill = YIELD_TIERS[tier].fill
    return {
      color: isSelected ? SELECTED_BORDER : '#ffffff',
      weight: isSelected ? 3 : 1,
      fillColor: fill,
      fillOpacity: isSelected ? 0.82 : 0.72,
    }
  }
  return {
    color: isSelected ? SELECTED_BORDER : '#ffffff',
    weight: isSelected ? 3 : 1,
    fillColor: '#86efac',
    fillOpacity: isSelected ? 0.52 : 0.38,
  }
}

function hoverPathStyle(feature, heatmapEnabled, selectedState, selectedConfidence) {
  const base = basePathStyle(feature, heatmapEnabled, selectedState, selectedConfidence)
  return {
    ...base,
    fillOpacity: Math.min(0.96, (base.fillOpacity || 0.4) + 0.1),
    weight: Math.max(base.weight || 1, 2),
    className: 'india-map-path-glow',
  }
}

export function IndiaMap({
  heatmapEnabled = true,
  selectedState = null,
  /** Last prediction confidence (0–1 or 0–100) — tints selected state fill */
  selectedConfidence = null,
  onStateClick,
  onUnsupportedRegion,
}) {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const mapZoom = useMobileMapZoom()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(indiaGeoUrl)
        if (!res.ok) throw new Error('Could not load map boundaries')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setLoadError(String(e.message || e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const styleFn = useCallback(
    (feature) => basePathStyle(feature, heatmapEnabled, selectedState, selectedConfidence),
    [heatmapEnabled, selectedState, selectedConfidence],
  )

  const onEach = useCallback(
    (feature, layer) => {
      const appState = resolveAppStateFromGeoFeature(feature)
      const label = appState || feature?.properties?.NAME_1 || 'Region'
      layer.bindTooltip(label, {
        sticky: true,
        direction: 'auto',
        opacity: 0.95,
        className: '!rounded-lg !border !border-white/40 !bg-slate-900/90 !px-2 !py-1 !text-xs !font-medium !text-white !shadow-lg',
      })

      layer.on({
        mouseover: (e) => {
          const l = e.target
          l.setStyle(hoverPathStyle(feature, heatmapEnabled, selectedState, selectedConfidence))
          l.bringToFront()
        },
        mouseout: (e) => {
          e.target.setStyle(styleFn(feature))
        },
        click: (e) => {
          if (!appState) {
            onUnsupportedRegion?.(feature)
            return
          }
          const ll = e.latlng
          onStateClick?.({
            appState,
            feature,
            layer: e.target,
            lat: ll?.lat,
            lng: ll?.lng,
          })
        },
      })
    },
    [heatmapEnabled, selectedState, selectedConfidence, styleFn, onStateClick, onUnsupportedRegion],
  )

  const geoKey = useMemo(
    () => `${heatmapEnabled ? 'h' : 'n'}-${data ? 'loaded' : 'empty'}`,
    [heatmapEnabled, data],
  )

  useEffect(() => {
    if (!L?.Icon?.Default?.prototype?._getIconUrl) return
    delete L.Icon.Default.prototype._getIconUrl
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[min(70vh,560px)] w-full min-h-[280px] overflow-hidden rounded-2xl border border-white/20 bg-slate-100 shadow-inner dark:border-white/10 dark:bg-slate-900 sm:min-h-[420px]"
    >
      {data && !loadError && (
        <MapContainer
          center={CENTER}
          zoom={mapZoom}
          scrollWheelZoom
          className="z-0 h-full w-full outline-none"
          style={{ minHeight: '280px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON key={geoKey} data={data} style={styleFn} onEachFeature={onEach} />
        </MapContainer>
      )}
      {!data && !loadError && (
        <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-600 dark:text-slate-400">
          Loading map layers…
        </div>
      )}
      {loadError && (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium text-amber-700 dark:text-amber-300">Map data unavailable</p>
          <p className="max-w-md text-xs">{loadError}</p>
        </div>
      )}
      <style>{`
        .leaflet-container { font-family: inherit; border-radius: 1rem; }
        .india-map-path-glow { filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.45)); }
        .map-pred-popup .leaflet-popup-content-wrapper {
          border-radius: 14px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
          animation: mapPredPopupIn 0.28s ease;
        }
        .map-pred-popup .leaflet-popup-content { margin: 12px 14px; }
        .map-pred-popup .leaflet-popup-tip { box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12); }
        @keyframes mapPredPopupIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </motion.div>
  )
}
