/**
 * Indian agricultural season from calendar month (approximate).
 * API uses Kharif / Rabi / Zaid (frontend SEASONS).
 * UI may show "Summer" for Zaid (Apr–May).
 */

export function detectIndianAgriSeason(date = new Date()) {
  const m = date.getMonth() + 1
  if (m >= 6 && m <= 9) {
    return { season: 'Kharif', displayLabel: 'Kharif (monsoon)' }
  }
  if (m >= 10 || m <= 3) {
    return { season: 'Rabi', displayLabel: 'Rabi' }
  }
  return { season: 'Zaid', displayLabel: 'Summer (Zaid)' }
}
