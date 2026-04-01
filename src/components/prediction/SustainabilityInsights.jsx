import { motion } from 'framer-motion'

function fmt2(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return n.toFixed(2)
}

/**
 * Crop waste & open-burning scenario metrics (estimated) + state-wise solutions.
 * @param {{ compact?: boolean, omitResidueCo2?: boolean, result: Record<string, unknown> }} props
 */
export function SustainabilityInsights({ result, compact = false, omitResidueCo2 = false }) {
  if (!result) return null
  const {
    residue_per_hectare: rph,
    residue_generated: residueTotal,
    co2_per_hectare: co2ph,
    co2_emission: co2Total,
    pm25_emission: pm25Total,
    waste_solutions: solutions,
    impact_message: impactMessage,
    emission_reduction_percent: reductionPct,
    co2_saved: co2Saved,
  } = result

  const hasData =
    residueTotal != null ||
    co2Total != null ||
    pm25Total != null ||
    (Array.isArray(solutions) && solutions.length > 0) ||
    typeof impactMessage === 'string'
  if (!hasData) return null

  const pad = compact ? 'p-4' : 'p-5'
  const textSize = compact ? 'text-xs' : 'text-sm'
  const pct =
    typeof reductionPct === 'number' && !Number.isNaN(reductionPct) ? Math.round(reductionPct) : 70

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/15 shadow-lg backdrop-blur-xl dark:border-emerald-500/25 ${pad}`}
      aria-labelledby="sustainability-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p
          id="sustainability-heading"
          className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-100"
        >
          Sustainability Insights
        </p>
        <p className="text-[10px] font-medium text-emerald-800/90 dark:text-emerald-300/90">
          Estimated using FAO & IPCC standards
        </p>
      </div>

      <div className={`mt-4 space-y-4 ${textSize} text-slate-800 dark:text-slate-100`}>
        {!omitResidueCo2 && (
          <>
            <div>
              <p className="mb-1.5 flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-50">
                <span aria-hidden>🌱</span>
                Residue
              </p>
              <ul className="ml-7 list-disc space-y-1 text-slate-800 dark:text-slate-200">
                <li>
                  {fmt2(residueTotal)} tons total <span className="text-slate-600 dark:text-slate-400">(est.)</span>
                </li>
                <li>
                  {fmt2(rph)} tons/hectare <span className="text-slate-600 dark:text-slate-400">(est.)</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-50">
                <span aria-hidden>🔥</span>
                CO₂ emission
              </p>
              <ul className="ml-7 list-disc space-y-1 text-slate-800 dark:text-slate-200">
                <li>
                  {fmt2(co2Total)} tons total{' '}
                  <span className="text-slate-600 dark:text-slate-400">(est., if burned)</span>
                </li>
                <li>
                  {fmt2(co2ph)} tons/hectare{' '}
                  <span className="text-slate-600 dark:text-slate-400">(est., if burned)</span>
                </li>
              </ul>
            </div>
          </>
        )}

        <div>
          <p className="mb-1.5 flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-50">
            <span aria-hidden>🌫</span>
            PM2.5
          </p>
          <ul className="ml-7 list-disc space-y-1 text-slate-800 dark:text-slate-200">
            <li>
              {fmt2(pm25Total)} kg total <span className="text-slate-600 dark:text-slate-400">(est., if burned)</span>
            </li>
          </ul>
        </div>

        {Array.isArray(solutions) && solutions.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-50">
              <span aria-hidden>♻️</span>
              Solutions
            </p>
            <ul className="ml-7 list-disc space-y-1.5 text-slate-800 dark:text-slate-200">
              {solutions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {typeof impactMessage === 'string' && impactMessage.trim() && (
          <div
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-slate-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-50"
            role="note"
          >
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
              <span aria-hidden>⚠️</span>
              Impact
            </p>
            <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed`}>{impactMessage}</p>
          </div>
        )}

        {co2Saved != null && (
          <div className="rounded-xl border border-emerald-600/35 bg-emerald-600/10 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-950/40">
            <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-950 dark:text-emerald-100">
              <span aria-hidden>✅</span>
              Sustainability benefit
            </p>
            <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-slate-900 dark:text-slate-100`}>
              By applying these solutions, CO₂ emissions can be reduced by up to{' '}
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">{pct}%</span>, saving
              approximately <span className="font-semibold text-emerald-700 dark:text-emerald-300">{fmt2(co2Saved)}</span>{' '}
              tons of CO₂ <span className="text-slate-600 dark:text-slate-400">(estimated)</span>.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  )
}
