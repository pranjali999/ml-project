import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Sprout,
  MapPinned,
  LineChart,
  MessageSquare,
  History,
} from 'lucide-react'

const items = [
  { to: '/prediction', label: 'Prediction', icon: Sprout },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'India Map', icon: MapPinned },
  { to: '/explain', label: 'Explainability', icon: LineChart },
  { to: '/chat', label: 'Assistant', icon: MessageSquare },
  { to: '/history', label: 'History', icon: History },
]

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 rounded-2xl border border-white/30 bg-white/50 p-3 shadow-lg shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-black/30">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Workspace
        </p>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.span
                  layout
                  className={`
                    flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
