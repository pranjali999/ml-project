import { detectIndianAgriSeason } from './seasonDetection.js'
import { fetchOpenMeteoForecast, fetchCoordsForState } from './weatherClient.js'
import { fetchSoilGridsTexture } from './soilClient.js'
import { getFallbackSoilForState, getStateProfile } from './mapHelpers.js'

/**
 * Resolve lat/lon: map click wins; else geocode state name.
 */
export async function resolveCoordinates(stateName, latlng) {
  if (
    latlng &&
    typeof latlng.lat === 'number' &&
    typeof latlng.lng === 'number' &&
    !Number.isNaN(latlng.lat) &&
    !Number.isNaN(latlng.lng)
  ) {
    return { lat: latlng.lat, lon: latlng.lng, source: 'map' }
  }
  const geo = await fetchCoordsForState(stateName)
  if (!geo) return null
  return { lat: geo.lat, lon: geo.lon, source: 'geocode' }
}

/**
 * Weather + soil + season for POST /predict, with caching and fallbacks.
 */
export async function buildRealtimeEnvironment(
  stateName,
  lat,
  lon,
  profile,
  cache,
  lastWeatherRef,
  options = {},
) {
  const { bypassCache = false } = options
  if (!bypassCache) {
    const cached = cache.get(lat, lon)
    if (cached) return cached
  }

  const season = detectIndianAgriSeason()

  let weather = await fetchOpenMeteoForecast(lat, lon).catch(() => null)
  let weatherSource = 'open-meteo'

  if (!weather?.ok) {
    const last = lastWeatherRef?.current
    if (last && typeof last.temperature === 'number') {
      weather = {
        ok: true,
        temperature: last.temperature,
        rainfallMm: last.rainfallMm ?? profile.avgRainfallMm,
      }
      weatherSource = 'last-known'
    } else {
      weather = {
        ok: true,
        temperature: profile.defaultTempC,
        rainfallMm: profile.avgRainfallMm,
      }
      weatherSource = 'climatology'
    }
  } else {
    if (lastWeatherRef) {
      lastWeatherRef.current = {
        temperature: weather.temperature,
        rainfallMm: weather.rainfallMm,
      }
    }
  }

  let soilGrids = await fetchSoilGridsTexture(lat, lon).catch(() => null)
  let soilBackend = 'unknown'
  let soilLabel = 'Unknown'
  let soilSource = 'soilgrids'

  if (soilGrids?.classification) {
    soilBackend = soilGrids.classification.backend
    soilLabel = soilGrids.classification.label
  } else {
    const fb = getFallbackSoilForState(stateName)
    soilBackend = fb.backend
    soilLabel = fb.label
    soilSource = 'region-fallback'
  }

  const snapshot = {
    lat,
    lng: lon,
    temperature: weather.temperature,
    rainfallMm: weather.rainfallMm,
    weatherSource,
    soilBackend,
    soilLabel,
    soilSource,
    sand: soilGrids?.sand,
    clay: soilGrids?.clay,
    silt: soilGrids?.silt,
    season: season.season,
    seasonDisplayLabel: season.displayLabel,
  }

  cache.set(lat, lon, snapshot)
  return snapshot
}

/**
 * When geocoding fails entirely, still produce minimal inputs from state profile only.
 */
export function buildProfileOnlyEnvironment(stateName) {
  const profile = getStateProfile(stateName)
  const season = detectIndianAgriSeason()
  const soil = getFallbackSoilForState(stateName)
  return {
    lat: null,
    lng: null,
    temperature: profile.defaultTempC,
    rainfallMm: profile.avgRainfallMm,
    weatherSource: 'climatology',
    soilBackend: soil.backend,
    soilLabel: soil.label,
    soilSource: 'region-fallback',
    sand: null,
    clay: null,
    silt: null,
    season: season.season,
    seasonDisplayLabel: season.displayLabel,
  }
}
