import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Sprout,
  Sun,
  Moon,
  Menu,
  X,
  History,
  LineChart,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/prediction', label: 'Prediction', icon: Sprout },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Map', icon: MapPinned },
  { to: '/explain', label: 'Explain', icon: LineChart },
  { to: '/chat', label: 'Assistant', icon: MessageSquare },
  { to: '/history', label: 'History', icon: History },
]

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/55 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-950/55">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2" aria-label="AgriMind home">
          <motion.div
            whileHover={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 0.5 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/30"
          >
            <Sprout className="h-5 w-5" aria-hidden />
          </motion.div>
          <div className="text-left leading-tight">
            <p className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              AgriMind
            </p>
            <p className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-400/90 sm:block">
              Decision OS
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition
                ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                }`
              }
            >
              {Icon && <Icon className="h-4 w-4 opacity-80" />}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={toggleTheme}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/60 text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-amber-200"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/60 text-slate-800 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/20 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/90 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'text-slate-700 dark:text-slate-300'
                    }`
                  }
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
