import { INDIAN_STATES } from './constants.js'

/** GADM admin1 keys (concatenated) → canonical names used in the app + backend-friendly labels */
export const GADM_REGION_TO_APP_STATE = {
  AndamanandNicobar: 'Andaman and Nicobar Islands',
  AndhraPradesh: 'Andhra Pradesh',
  ArunachalPradesh: 'Arunachal Pradesh',
  Assam: 'Assam',
  Bihar: 'Bihar',
  Chandigarh: 'Chandigarh',
  Chhattisgarh: 'Chhattisgarh',
  DadraandNagarHaveli: 'Dadra and Nagar Haveli and Daman and Diu',
  DamanandDiu: 'Dadra and Nagar Haveli and Daman and Diu',
  Goa: 'Goa',
  Gujarat: 'Gujarat',
  Haryana: 'Haryana',
  HimachalPradesh: 'Himachal Pradesh',
  JammuandKashmir: 'Jammu and Kashmir',
  Ladakh: 'Ladakh',
  Jharkhand: 'Jharkhand',
  Karnataka: 'Karnataka',
  Kerala: 'Kerala',
  Lakshadweep: 'Lakshadweep',
  MadhyaPradesh: 'Madhya Pradesh',
  Maharashtra: 'Maharashtra',
  Manipur: 'Manipur',
  Meghalaya: 'Meghalaya',
  Mizoram: 'Mizoram',
  Nagaland: 'Nagaland',
  NCTofDelhi: 'Delhi',
  Odisha: 'Odisha',
  Puducherry: 'Puducherry',
  Punjab: 'Punjab',
  Rajasthan: 'Rajasthan',
  Sikkim: 'Sikkim',
  TamilNadu: 'Tamil Nadu',
  Telangana: 'Telangana',
  Tripura: 'Tripura',
  UttarPradesh: 'Uttar Pradesh',
  Uttarakhand: 'Uttarakhand',
  WestBengal: 'West Bengal',
}

const LEGACY_PROP_KEYS = ['ST_NM', 'NAME_1', 'STATE', 'NAME', 'state', 'State']

/** Dummy yield tier for heatmap (illustrative). */
export const YIELD_TIERS = {
  high: { fill: '#15803d', label: 'High yield (demo)' },
  medium: { fill: '#ca8a04', label: 'Medium yield (demo)' },
  low: { fill: '#b91c1c', label: 'Low yield (demo)' },
}

/**
 * @typedef {{ tier: 'high'|'medium'|'low', crops: string[], avgRainfallMm: number, defaultTempC: number }} StateProfile
 * @type {Record<string, StateProfile>}
 */
export const STATE_PROFILES = {
  'Andhra Pradesh': {
    tier: 'high',
    crops: ['Rice', 'Cotton', 'Groundnut'],
    avgRainfallMm: 1100,
    defaultTempC: 28,
  },
  'Arunachal Pradesh': {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Millets'],
    avgRainfallMm: 2800,
    defaultTempC: 22,
  },
  Assam: {
    tier: 'high',
    crops: ['Rice', 'Tea', 'Maize'],
    avgRainfallMm: 2200,
    defaultTempC: 26,
  },
  Bihar: {
    tier: 'high',
    crops: ['Rice', 'Wheat', 'Maize'],
    avgRainfallMm: 1200,
    defaultTempC: 27,
  },
  Chhattisgarh: {
    tier: 'medium',
    crops: ['Rice', 'Pulses', 'Maize'],
    avgRainfallMm: 1300,
    defaultTempC: 27,
  },
  Goa: {
    tier: 'medium',
    crops: ['Rice', 'Coconut', 'Vegetables'],
    avgRainfallMm: 3000,
    defaultTempC: 27,
  },
  Gujarat: {
    tier: 'high',
    crops: ['Cotton', 'Groundnut', 'Wheat'],
    avgRainfallMm: 800,
    defaultTempC: 28,
  },
  Haryana: {
    tier: 'high',
    crops: ['Wheat', 'Rice', 'Cotton'],
    avgRainfallMm: 600,
    defaultTempC: 25,
  },
  'Himachal Pradesh': {
    tier: 'medium',
    crops: ['Maize', 'Potato', 'Wheat'],
    avgRainfallMm: 1500,
    defaultTempC: 18,
  },
  Jharkhand: {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Pulses'],
    avgRainfallMm: 1400,
    defaultTempC: 26,
  },
  Karnataka: {
    tier: 'high',
    crops: ['Rice', 'Maize', 'Groundnut'],
    avgRainfallMm: 1200,
    defaultTempC: 26,
  },
  Kerala: {
    tier: 'high',
    crops: ['Rice', 'Coconut', 'Spices'],
    avgRainfallMm: 2800,
    defaultTempC: 27,
  },
  'Madhya Pradesh': {
    tier: 'high',
    crops: ['Soybean', 'Wheat', 'Maize'],
    avgRainfallMm: 900,
    defaultTempC: 26,
  },
  Maharashtra: {
    tier: 'high',
    crops: ['Sugarcane', 'Cotton', 'Millets'],
    avgRainfallMm: 1200,
    defaultTempC: 27,
  },
  Manipur: {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Pulses'],
    avgRainfallMm: 1500,
    defaultTempC: 23,
  },
  Meghalaya: {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Potato'],
    avgRainfallMm: 2500,
    defaultTempC: 22,
  },
  Mizoram: {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Pulses'],
    avgRainfallMm: 2000,
    defaultTempC: 23,
  },
  Nagaland: {
    tier: 'medium',
    crops: ['Rice', 'Maize', 'Millets'],
    avgRainfallMm: 1800,
    defaultTempC: 22,
  },
  Odisha: {
    tier: 'high',
    crops: ['Rice', 'Pulses', 'Oilseeds'],
    avgRainfallMm: 1500,
    defaultTempC: 28,
  },
  Punjab: {
    tier: 'high',
    crops: ['Wheat', 'Rice', 'Maize'],
    avgRainfallMm: 600,
    defaultTempC: 24,
  },
  Rajasthan: {
    tier: 'low',
    crops: ['Millets', 'Pulses', 'Wheat'],
    avgRainfallMm: 500,
    defaultTempC: 28,
  },
  Sikkim: {
    tier: 'medium',
    crops: ['Maize', 'Rice', 'Potato'],
    avgRainfallMm: 2500,
    defaultTempC: 18,
  },
  'Tamil Nadu': {
    tier: 'high',
    crops: ['Rice', 'Sugarcane', 'Cotton'],
    avgRainfallMm: 950,
    defaultTempC: 29,
  },
  Telangana: {
    tier: 'high',
    crops: ['Rice', 'Cotton', 'Maize'],
    avgRainfallMm: 900,
    defaultTempC: 28,
  },
  Tripura: {
    tier: 'medium',
    crops: ['Rice', 'Potato', 'Pulses'],
    avgRainfallMm: 2200,
    defaultTempC: 26,
  },
  'Uttar Pradesh': {
    tier: 'high',
    crops: ['Rice', 'Wheat', 'Sugarcane'],
    avgRainfallMm: 900,
    defaultTempC: 26,
  },
  Uttarakhand: {
    tier: 'medium',
    crops: ['Wheat', 'Rice', 'Potato'],
    avgRainfallMm: 1400,
    defaultTempC: 20,
  },
  'West Bengal': {
    tier: 'high',
    crops: ['Rice', 'Jute', 'Potato'],
    avgRainfallMm: 1800,
    defaultTempC: 27,
  },
  Delhi: {
    tier: 'medium',
    crops: ['Wheat', 'Millets', 'Vegetables'],
    avgRainfallMm: 750,
    defaultTempC: 26,
  },
}

export function getStateProfile(stateName) {
  return STATE_PROFILES[stateName] || {
    tier: 'medium',
    crops: ['Rice', 'Wheat', 'Maize'],
    avgRainfallMm: 1000,
    defaultTempC: 27,
  }
}

export function getYieldTier(stateName) {
  return getStateProfile(stateName).tier
}

/**
 * When SoilGrids is unavailable — coarse regional heuristic → backend soil class.
 */
export function getFallbackSoilForState(stateName) {
  const arid = ['Rajasthan', 'Gujarat']
  const black = ['Madhya Pradesh', 'Maharashtra', 'Telangana', 'Chhattisgarh']
  const alluvial = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'West Bengal']
  const laterite = ['Kerala', 'Karnataka', 'Goa']
  const mountain = [
    'Himachal Pradesh',
    'Uttarakhand',
    'Arunachal Pradesh',
    'Sikkim',
    'Ladakh',
    'Jammu and Kashmir',
  ]
  if (arid.includes(stateName)) return { backend: 'arid', label: 'Arid / sandy (regional fallback)' }
  if (black.includes(stateName)) return { backend: 'black', label: 'Clayey / black (regional fallback)' }
  if (alluvial.includes(stateName)) return { backend: 'alluvial', label: 'Alluvial (regional fallback)' }
  if (laterite.includes(stateName)) return { backend: 'laterite', label: 'Laterite (regional fallback)' }
  if (mountain.includes(stateName)) return { backend: 'mountain', label: 'Mountain (regional fallback)' }
  return { backend: 'unknown', label: 'Unknown (regional fallback)' }
}

/**
 * Resolve GeoJSON feature to an app state name in INDIAN_STATES, or null if unsupported.
 */
export function resolveAppStateFromGeoFeature(feature) {
  const p = feature?.properties || {}
  const gadmKey = typeof p.NAME_1 === 'string' ? p.NAME_1 : null
  if (gadmKey && Object.prototype.hasOwnProperty.call(GADM_REGION_TO_APP_STATE, gadmKey)) {
    const mapped = GADM_REGION_TO_APP_STATE[gadmKey]
    return mapped
  }
  return legacyGetStateNameFromFeature(feature)
}

function legacyGetStateNameFromFeature(feature) {
  const p = feature?.properties || {}
  for (const k of LEGACY_PROP_KEYS) {
    if (p[k] && typeof p[k] === 'string') return normalizeToIndianState(p[k])
  }
  return null
}

function normalizeToIndianState(raw) {
  let s = raw.trim()
  const lower = s.toLowerCase()
  if (lower === 'orissa') s = 'Odisha'
  if (lower === 'uttaranchal') s = 'Uttarakhand'
  if (lower === 'pondicherry' || lower === 'pondichery') s = 'Puducherry'
  if (lower === 'laddak') s = 'Ladakh'
  if (lower.includes('dadra') && lower.includes('haveli')) {
    s = 'Dadra and Nagar Haveli and Daman and Diu'
  }
  if (lower.includes('andaman') && lower.includes('nicobar')) {
    s = 'Andaman and Nicobar Islands'
  }
  if (lower.includes('delhi') && !lower.includes('new')) s = 'Delhi'

  const exact = INDIAN_STATES.find((x) => x.toLowerCase() === s.toLowerCase())
  if (exact) return exact

  const found = INDIAN_STATES.find(
    (x) => s.toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(s.toLowerCase()),
  )
  if (found) return found

  return INDIAN_STATES.includes(s) ? s : null
}

/** @deprecated use resolveAppStateFromGeoFeature */
export function getStateNameFromFeature(feature) {
  return resolveAppStateFromGeoFeature(feature)
}

export function normalizeStateForForm(raw) {
  if (!raw || typeof raw !== 'string') return null
  return normalizeToIndianState(raw)
}
