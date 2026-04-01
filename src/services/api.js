/**
 * Central API layer — Axios client for Flask backend.
 *
 * In dev (`npm run dev`), requests go to `/api` and Vite proxies to Flask on :8000
 * so the browser never cross-origin calls the API (avoids CORS / connection issues).
 * Set VITE_API_BASE_URL to override (e.g. full URL for mobile testing on LAN).
 */
import axios from 'axios'

function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
  const isLocalBackend =
    raw === '' ||
    raw === 'http://127.0.0.1:8000' ||
    raw === 'http://localhost:8000'
  if (import.meta.env.DEV && isLocalBackend) {
    return '/api'
  }
  if (raw) return raw
  return 'http://127.0.0.1:8000'
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
})

export function getApiErrorMessage(error) {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'Request timed out — check the backend is running.'
    if (error?.message === 'Network Error') {
      const hint =
        API_BASE_URL === '/api'
          ? ' Start the Flask backend on port 8000, then restart `npm run dev` if you just changed Vite config.'
          : ' Is the API running at ' + API_BASE_URL + '?'
      return 'Network error — could not reach the API.' + hint
    }
  }
  const d = error?.response?.data
  if (typeof d?.detail === 'string') return d.detail
  if (typeof d?.message === 'string') return d.message
  if (typeof d?.error === 'string') return d.error
  if (Array.isArray(d?.details)) {
    try {
      return d.details.map((x) => x.msg || JSON.stringify(x)).join('; ')
    } catch {
      /* ignore */
    }
  }
  if (error?.message) return error.message
  return 'Request failed'
}

/** POST /predict */
export async function predict(data) {
  const { data: res } = await api.post('/predict', data)
  return res
}

import { mapEnvToApiSourceLabels } from '../utils/mapUxLabels.js'

/**
 * Build POST /predict body from live environment (map + Open-Meteo + soil + season).
 * @param {Record<string, unknown> | null} [envSnapshot] — used for weather_source / soil_source metadata
 */
export function buildRealtimePredictPayload({
  stateName,
  temperature,
  rainfallMm,
  soil,
  season,
  crop = 'Wheat',
  area = 1,
  envSnapshot = null,
}) {
  const temp = typeof temperature === 'number' && !Number.isNaN(temperature) ? temperature : 28
  const rain = typeof rainfallMm === 'number' && !Number.isNaN(rainfallMm) ? rainfallMm : 850
  const { weather, soil: soilSrc } = mapEnvToApiSourceLabels(envSnapshot)
  return {
    state: stateName,
    crop,
    season,
    rainfall: Math.round(rain * 10) / 10,
    temperature: Math.round(temp * 10) / 10,
    area,
    region: stateName,
    soil: soil && String(soil).trim() ? String(soil).trim().toLowerCase() : 'unknown',
    include_shap_plot: false,
    weather_source: weather,
    soil_source: soilSrc,
  }
}

/** POST /recommend */
export async function recommend(data) {
  const { data: res } = await api.post('/recommend', data)
  return res
}

/** POST /explain */
export async function explain(data) {
  const { data: res } = await api.post('/explain', data)
  return res
}

/** POST /chatbot — pass a string or { query } */
export async function chatbot(query) {
  const q = typeof query === 'string' ? query : query?.query ?? ''
  const { data: res } = await api.post('/chatbot', { query: q })
  return res
}

/** POST /forecast */
export async function forecast(data = {}) {
  const { data: res } = await api.post('/forecast', data)
  return res
}

/**
 * List saved predictions from MongoDB (backend uses POST /history, not GET).
 * @param {{ userId?: string, limit?: number }} options
 */
export async function history(options = {}) {
  const userId = options.userId ?? getDefaultUserId()
  const limit = options.limit ?? 50
  const { data: res } = await api.post('/history', {
    action: 'list',
    user_id: userId,
    limit,
  })
  return res
}

/** POST /history action save — persists when MongoDB is configured */
export async function saveHistory({ userId, input, prediction, meta }) {
  const { data: res } = await api.post('/history', {
    action: 'save',
    user_id: userId ?? getDefaultUserId(),
    input,
    prediction,
    meta,
  })
  return res
}

/** GET /health */
export async function getHealth() {
  const { data: res } = await api.get('/health')
  return res
}

/** POST /risk */
export async function postRisk(body) {
  const { data: res } = await api.post('/risk', body)
  return res
}

/** Stable anonymous id for history endpoints */
export function getDefaultUserId() {
  if (typeof window === 'undefined' || !window.localStorage) return 'ssr-anon'
  let id = window.localStorage.getItem('agrimind-user-id')
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `user-${Date.now()}`
    window.localStorage.setItem('agrimind-user-id', id)
  }
  return id
}
