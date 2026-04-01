/**
 * Short-lived cache for lat/lon-bound environmental fetches (weather + soil).
 * Key: rounded coordinates to ~11m precision to dedupe nearby clicks.
 */

const DEFAULT_TTL_MS = 20 * 60 * 1000

function roundKey(lat, lon) {
  return `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`
}

export function createRealtimeCache(ttlMs = DEFAULT_TTL_MS) {
  const store = new Map()

  return {
    get(lat, lon) {
      const k = roundKey(lat, lon)
      const hit = store.get(k)
      if (!hit) return null
      if (Date.now() - hit.ts > ttlMs) {
        store.delete(k)
        return null
      }
      return hit.value
    },
    set(lat, lon, value) {
      store.set(roundKey(lat, lon), { value, ts: Date.now() })
    },
    invalidate(lat, lon) {
      store.delete(roundKey(lat, lon))
    },
    clear() {
      store.clear()
    },
  }
}
