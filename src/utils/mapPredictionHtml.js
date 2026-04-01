import {
  escapeHtml,
  formatYieldLine,
  formatProfitInr,
  formatDecisionSummaryLine,
  uiTempTag,
  uiRainTag,
  uiSoilTag,
  shortSoilDisplayName,
} from './mapUxLabels.js'

export { escapeHtml, formatYieldLine, formatProfitInr, formatDecisionSummaryLine }

/** Loading state inside Leaflet popup (before API returns). */
export function buildPopupLoadingHtml(stateName, lat, lng) {
  const sn = escapeHtml(stateName)
  const coord =
    typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? `${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)}`
      : '—'
  return `
    <div class="map-popup-loading" style="font-family:system-ui,sans-serif;min-width:200px;padding:4px 0">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a">📍 ${coord}</p>
      <p style="margin:0 0 10px;font-size:13px;color:#334155">${sn}</p>
      <p style="margin:0;font-size:12px;color:#64748b">⏳ Fetching real-time data…</p>
    </div>
  `
}

function formatRiskTitle(r) {
  if (r == null || r === '') return '—'
  const s = String(r).trim().toLowerCase()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
}

function confidencePct(c) {
  if (c == null || Number.isNaN(Number(c))) return null
  const n = Number(c)
  const p = n <= 1 ? n * 100 : n
  return `${Math.round(p)}%`
}

/**
 * Compact popup after success — coordinates 2dp, short summary, muted source lines.
 */
export function buildPredictionPopupHtml(stateName, result, payload, envSnapshot = null) {
  const sn = escapeHtml(stateName)
  const best = escapeHtml(result?.recommended_crop ?? payload?.crop ?? '—')
  const risk = escapeHtml(formatRiskTitle(result?.risk))
  const yieldLine = escapeHtml(formatYieldLine(result))
  const conf = confidencePct(result?.confidence)
  const confHtml = conf
    ? `<p style="margin:6px 0 0;font-size:12px;color:#334155">📈 Confidence: <strong>${escapeHtml(conf)}</strong></p>`
    : ''

  const ds = result?.data_source
  const tempTag = escapeHtml(uiTempTag(envSnapshot?.weatherSource))
  const rainTag = escapeHtml(uiRainTag(envSnapshot?.weatherSource))
  const soilTag = escapeHtml(uiSoilTag(envSnapshot?.soilSource))
  const soilName = escapeHtml(shortSoilDisplayName(envSnapshot))

  let coordLine = ''
  if (envSnapshot?.lat != null && envSnapshot?.lng != null) {
    coordLine = `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#0f172a">📍 ${Number(envSnapshot.lat).toFixed(2)}, ${Number(envSnapshot.lng).toFixed(2)}</p>`
  }

  let muted = ''
  if (envSnapshot && typeof envSnapshot === 'object') {
    const t =
      typeof envSnapshot.temperature === 'number' && !Number.isNaN(envSnapshot.temperature)
        ? `${envSnapshot.temperature.toFixed(1)}°C`
        : '—'
    const r =
      typeof envSnapshot.rainfallMm === 'number' && !Number.isNaN(envSnapshot.rainfallMm)
        ? `${envSnapshot.rainfallMm.toFixed(1)} mm`
        : '—'
    const wLabel = ds?.weather ? escapeHtml(ds.weather) : 'Open-Meteo'
    const sLabel = ds?.soil ? escapeHtml(ds.soil) : 'ISRIC SoilGrids'
    muted = `
      <div style="margin:10px 0 0;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;line-height:1.5;color:#94a3b8">
        <div>🌡 Temperature: ${escapeHtml(t)} <span style="opacity:.9">(${tempTag})</span> · ${wLabel}</div>
        <div>🌧 Rainfall: ${escapeHtml(r)} <span style="opacity:.9">(${rainTag})</span></div>
        <div>🌱 Soil: ${soilName} <span style="opacity:.9">(${soilTag})</span> · ${sLabel}</div>
      </div>
    `
  }

  const ts = result?.data_timestamp
  const tsLine =
    typeof ts === 'number'
      ? `<p style="margin:8px 0 0;font-size:10px;color:#94a3b8">⏱ Updated ${new Date(ts).toLocaleString()}</p>`
      : ''

  return `
    <div class="map-pred-popup-inner" style="font-family:system-ui,sans-serif;min-width:240px;max-width:300px;padding:2px 0">
      ${coordLine}
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a">${sn}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#334155">✅ Best: <strong>${best}</strong></p>
      <p style="margin:0 0 4px;font-size:12px;color:#334155">⚠️ Risk: <strong>${risk}</strong></p>
      <p style="margin:0 0 4px;font-size:12px;color:#334155">📊 Yield: <strong>${yieldLine}</strong></p>
      ${confHtml}
      ${muted}
      ${tsLine}
      <button type="button" class="map-pred-navigate" style="width:100%;border-radius:10px;background:#059669;color:#fff;padding:10px 12px;font-size:12px;font-weight:600;border:none;cursor:pointer;margin-top:12px">
        View full prediction →
      </button>
    </div>
  `
}

export function buildPredictionErrorHtml(message) {
  const m = escapeHtml(message || 'Unable to fetch prediction')
  return `
    <div style="font-family:system-ui,sans-serif;min-width:220px;max-width:280px;padding:4px 0">
      <p style="margin:0 0 8px;font-weight:600;color:#b91c1c">Unable to fetch prediction</p>
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.4">${m}</p>
    </div>
  `
}

export function wireMapPredictionPopupButton(layer, onNavigate) {
  const run = () => {
    const el = layer.getPopup()?.getElement?.()
    const btn = el?.querySelector?.('.map-pred-navigate')
    if (btn && typeof onNavigate === 'function') {
      btn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        onNavigate()
      }
    }
  }
  layer.off('popupopen')
  layer.on('popupopen', run)
  setTimeout(run, 0)
}
