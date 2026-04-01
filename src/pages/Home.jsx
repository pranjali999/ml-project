import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Brain,
  Leaf,
  MapPin,
  Recycle,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

const features = [
  {
    title: 'Yield & environment',
    desc: 'Forecast yield (t/ha) using rainfall, temperature, soil context, and season — with confidence and timing metadata.',
    icon: TrendingUp,
    accent: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    title: 'Crop recommendation',
    desc: 'Suggested crop and alternatives for your region, aligned with agro-climatic signals from the API.',
    icon: Leaf,
    accent: 'from-sky-500/20 to-blue-500/10',
  },
  {
    title: 'Profit & risk',
    desc: 'Estimated profit or loss in INR plus a composite risk band and short explanations you can act on.',
    icon: BarChart3,
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    title: 'Explainability & SHAP',
    desc: 'Feature importance, top driving factor, and optional SHAP-style insight text for transparency.',
    icon: Brain,
    accent: 'from-violet-500/20 to-purple-500/10',
  },
  {
    title: 'Crop waste & sustainability',
    desc: 'Residue (FAO-style RPR), CO₂ and PM2.5 if residue were burned, state-wise reuse options, and illustrative savings using IPCC-style factors.',
    icon: Recycle,
    accent: 'from-lime-500/20 to-emerald-500/10',
  },
  {
    title: 'Map & live inputs',
    desc: 'Pick a region on the India map, pull Open-Meteo weather and soil context, and run predictions from the side panel.',
    icon: MapPin,
    accent: 'from-cyan-500/20 to-sky-500/10',
  },
]

const floatOrbs = [
  { className: 'left-[8%] top-[18%] h-72 w-72 bg-emerald-400/30', delay: 0 },
  { className: 'right-[10%] top-[28%] h-56 w-56 bg-sky-400/25', delay: 0.4 },
  { className: 'left-[35%] bottom-[12%] h-48 w-48 bg-teal-400/20', delay: 0.8 },
]

export default function Home() {
  return (
    <div className="space-y-24 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/40 px-6 py-20 shadow-[var(--shadow-float)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 sm:px-10 lg:px-16">
        {floatOrbs.map((o, i) => (
          <motion.div
            key={i}
            className={`pointer-events-none absolute -z-0 rounded-full blur-3xl ${o.className}`}
            animate={{ y: [0, -18, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: o.delay,
            }}
          />
        ))}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Agricultural Decision Support System
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
          >
            Grow smarter with{' '}
            <span className="text-gradient">precision intelligence</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400"
          >
            Yield, profit, risk, and explainability in one flow — plus{' '}
            <strong className="font-semibold text-slate-800 dark:text-slate-200">
              crop residue, emissions, and state-wise sustainability options
            </strong>{' '}
            (FAO / IPCC-style factors). Use the form or the map with live weather and soil context.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/prediction">
              <Button className="min-w-[200px] px-8 py-3 text-base" icon={ArrowRight}>
                Get prediction
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="secondary" className="min-w-[160px] px-8 py-3 text-base" icon={MapPin}>
                Map & live data
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" className="px-8 py-3 text-base">
                Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="mb-10 flex flex-col gap-2 text-center sm:mb-14">
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Everything in AgriMind today
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
            From core agronomic forecasts to sustainability and map-driven inputs — designed for teams who want
            clear numbers, honest uncertainty, and a polished UI.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <Card float className="relative h-full overflow-hidden p-6">
                <div
                  className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${f.accent} p-3 text-emerald-700 dark:text-emerald-300`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
