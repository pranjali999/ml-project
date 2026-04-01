/**
 * ISRIC SoilGrids 2.0 — sand / clay / silt at point.
 * In dev, Vite proxies `/isric` → https://rest.isric.org (see vite.config.js).
 */

function resolveSoilQueryUrl() {
  return import.meta.env.DEV
    ? '/isric/soilgrids/v2.0/properties/query'
    : 'https://rest.isric.org/soilgrids/v2.0/properties/query'
}

function extractMeanForProperty(json, propName) {
  const list = json?.properties?.layers
  if (!Array.isArray(list)) return null
  const layer = list.find((l) => String(l?.name || '').toLowerCase() === propName.toLowerCase())
  const depths = layer?.depths
  const first = Array.isArray(depths) ? depths[0] : null
  const mean = first?.values?.mean ?? first?.values?.Mean
  return typeof mean === 'number' && !Number.isNaN(mean) ? mean : null
}

/**
 * Map texture → backend soil class (must exist in model / crop RF encoder).
 * Display label kept human-readable.
 */
export function classifySoilTexture(sand, clay, silt) {
  const s = Number(sand) || 0
  const c = Number(clay) || 0
  const i = Number(silt) || 0
  const t = s + c + i
  if (t <= 0) {
    return { backend: 'unknown', label: 'Unknown' }
  }
  const ps = (100 * s) / t
  const pc = (100 * c) / t
  const pi = (100 * i) / t
  if (ps >= 52) {
    return { backend: 'arid', label: `Sandy (~${ps.toFixed(0)}% sand → arid)` }
  }
  if (pc >= 38) {
    return { backend: 'black', label: `Clayey (~${pc.toFixed(0)}% clay → black)` }
  }
  if (pi >= 35 && ps < 45 && pc < 38) {
    return { backend: 'alluvial', label: `Loamy / silty (~${pi.toFixed(0)}% silt → alluvial)` }
  }
  if (Math.abs(ps - pi) < 12 && pc < 32) {
    return { backend: 'alluvial', label: `Balanced loamy (sand/silt/clay)` }
  }
  if (pc > ps && pc > pi) {
    return { backend: 'black', label: `Clay-dominant (~${pc.toFixed(0)}% clay)` }
  }
  return { backend: 'red', label: `Mixed texture (sand ${ps.toFixed(0)}%, clay ${pc.toFixed(0)}%)` }
}

/**
 * @returns {Promise<{ sand: number, clay: number, silt: number, classification: ReturnType<classifySoilTexture> } | null>}
 */
export async function fetchSoilGridsTexture(lat, lon) {
  const url = resolveSoilQueryUrl()
  const body = {
    lon: Number(lon),
    lat: Number(lat),
    property: ['sand', 'clay', 'silt'],
    depth: '0-5cm',
    value: 'mean',
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const json = await res.json()
  const sand = extractMeanForProperty(json, 'sand')
  const clay = extractMeanForProperty(json, 'clay')
  const silt = extractMeanForProperty(json, 'silt')
  if (sand == null && clay == null && silt == null) return null
  const classification = classifySoilTexture(sand ?? 0, clay ?? 0, silt ?? 0)
  return {
    sand: sand ?? 0,
    clay: clay ?? 0,
    silt: silt ?? 0,
    classification,
  }
}
