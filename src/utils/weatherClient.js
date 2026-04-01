/**
 * Open-Meteo: forecast for coordinates (no API key).
 * Geocoding for state → lat/lon when the map did not supply a click point.
 */

/**
 * @returns {Promise<{ lat: number, lon: number } | null>}
 */
export async function fetchCoordsForState(stateName) {
  const q = encodeURIComponent(`${stateName}, India`)
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`,
  )
  if (!geoRes.ok) return null
  const geo = await geoRes.json()
  const hit = geo.results?.[0]
  if (hit?.latitude == null || hit?.longitude == null) return null
  return { lat: hit.latitude, lon: hit.longitude }
}

/**
 * Real-time temperature + today's daily precipitation sum (mm).
 * @see https://api.open-meteo.com/v1/forecast
 */
export async function fetchOpenMeteoForecast(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}&current_weather=true&daily=precipitation_sum&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) return { ok: false }
  const data = await res.json()
  const temp = data.current_weather?.temperature
  if (typeof temp !== 'number' || Number.isNaN(temp)) return { ok: false }

  const times = data.daily?.time || []
  const sums = data.daily?.precipitation_sum || []
  const today = new Date().toISOString().slice(0, 10)
  let idx = times.findIndex((t) => String(t).startsWith(today))
  if (idx < 0) idx = 0
  const rainfallMm = typeof sums[idx] === 'number' && !Number.isNaN(sums[idx]) ? sums[idx] : 0

  return { ok: true, temperature: temp, rainfallMm }
}

/** @deprecated prefer fetchOpenMeteoForecast + coords */
export async function fetchWeatherHintsForRegion(stateName) {
  const c = await fetchCoordsForState(stateName)
  if (!c) return null
  const w = await fetchOpenMeteoForecast(c.lat, c.lon)
  if (!w?.ok) return { latitude: c.lat, longitude: c.lon, temperature: null }
  return {
    latitude: c.lat,
    longitude: c.lon,
    temperature: w.temperature,
    rainfallMm: w.rainfallMm,
  }
}
