import {
  CROP_ALIASES,
  CROPS,
  INDIAN_STATES,
  SEASON_ALIASES,
  SEASONS,
  STATE_ALIASES,
} from './constants.js'

/**
 * Best-effort parsing of transcript into partial form updates.
 */
export function parseVoiceToForm(transcript) {
  const t = transcript.toLowerCase()
  const updates = {}

  for (const [alias, state] of Object.entries(STATE_ALIASES)) {
    if (t.includes(alias)) {
      updates.state = state
      break
    }
  }
  if (!updates.state) {
    for (const s of INDIAN_STATES) {
      if (t.includes(s.toLowerCase())) {
        updates.state = s
        break
      }
    }
  }

  for (const [alias, crop] of Object.entries(CROP_ALIASES)) {
    if (t.includes(alias)) {
      updates.crop = crop
      break
    }
  }
  if (!updates.crop) {
    for (const c of CROPS) {
      if (t.includes(c.toLowerCase())) {
        updates.crop = c
        break
      }
    }
  }

  for (const [alias, season] of Object.entries(SEASON_ALIASES)) {
    if (t.includes(alias)) {
      updates.season = season
      break
    }
  }
  if (!updates.season) {
    for (const s of SEASONS) {
      if (t.includes(s.toLowerCase())) {
        updates.season = s
        break
      }
    }
  }

  const rainMatch = t.match(/rain(?:fall)?\s*(?:of|is|:)?\s*(\d+)/i)
  if (rainMatch) updates.rainfall = clampNum(Number(rainMatch[1]), 0, 5000)

  const areaMatch = t.match(/area\s*(?:of|is|:)?\s*(\d+(?:\.\d+)?)/i)
  if (areaMatch) updates.area = clampNum(Number(areaMatch[1]), 0.1, 10000)

  const tempMatch = t.match(/temp(?:erature)?\s*(?:of|is|:)?\s*(\d+(?:\.\d+)?)/i)
  if (tempMatch) updates.temperature = clampNum(Number(tempMatch[1]), -5, 55)

  const plainNums = transcript.match(/\b(\d+(?:\.\d+)?)\b/g)
  if (plainNums && !updates.rainfall && plainNums.length >= 1) {
    const n = Number(plainNums[0])
    if (n > 200 && n < 4000) updates.rainfall = Math.round(n)
  }

  return updates
}

function clampNum(n, min, max) {
  if (Number.isNaN(n)) return undefined
  return Math.min(max, Math.max(min, n))
}
