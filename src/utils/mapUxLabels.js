/** Escape text for Leaflet popup innerHTML */
export function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatYieldLine(result) {
  const y = result?.yield
  const u = result?.detail?.yield_unit
  if (y == null || y === '') return '—'
  if (u) return `${y} ${String(u).replace(/_/g, ' ')}`
  return String(y)
}

export function formatProfitInr(profit) {
  if (profit == null || Number.isNaN(Number(profit))) return '—'
  return `₹${Number(profit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatDecisionSummaryLine(ds) {
  if (!ds) return ''
  if (typeof ds === 'string') return ds.length > 140 ? `${ds.slice(0, 137)}…` : ds
  if (typeof ds === 'object') {
    const h = ds.headline ?? ds.summary ?? ds.title
    if (typeof h === 'string') return h.length > 140 ? `${h.slice(0, 137)}…` : h
  }
  return ''
}

/** Labels for API payload (backend data_source) */
export function mapEnvToApiSourceLabels(env) {
  if (!env) {
    return { weather: 'Open-Meteo', soil: 'ISRIC SoilGrids' }
  }
  const w = env.weatherSource
  let weather = 'Open-Meteo'
  if (w === 'last-known') weather = 'Cached observation'
  else if (w === 'climatology') weather = 'Regional climatology'
  const s = env.soilSource
  let soil = 'ISRIC SoilGrids'
  if (s === 'region-fallback') soil = 'Regional heuristic'
  return { weather, soil }
}

/** UI tags under metrics (muted) */
export function uiTempTag(weatherSource) {
  if (weatherSource === 'open-meteo') return 'Live'
  if (weatherSource === 'last-known') return 'Cached'
  return 'Regional'
}

export function uiRainTag(weatherSource) {
  if (weatherSource === 'open-meteo') return 'Forecast'
  if (weatherSource === 'last-known') return 'Cached'
  return 'Regional'
}

export function uiSoilTag(soilSource) {
  if (soilSource === 'soilgrids') return 'SoilGrids'
  return 'Heuristic'
}

/** Human-readable soil line e.g. "Loamy" from env.soilLabel */
export function shortSoilDisplayName(envSnapshot) {
  if (!envSnapshot?.soilLabel) return '—'
  const raw = String(envSnapshot.soilLabel)
  const cut = raw.split('→')[0]?.trim() || raw
  return cut.length > 42 ? `${cut.slice(0, 39)}…` : cut
}

export function formatMinutesAgo(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return '—'
  const diff = Date.now() - Number(ms)
  if (diff < 0) return 'just now'
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m === 1) return '1 minute ago'
  if (m < 60) return `${m} minutes ago`
  const h = Math.floor(m / 60)
  if (h === 1) return '1 hour ago'
  return `${h} hours ago`
}
