import { motion } from 'framer-motion'

export function Card({
  children,
  className = '',
  hover = true,
  float = false,
  as: Component = motion.div,
  ...rest
}) {
  return (
    <Component
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        hover
          ? {
              y: float ? -6 : -2,
              boxShadow:
                '0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255,255,255,0.5)',
            }
          : undefined
      }
      className={`
        glass rounded-2xl p-6 transition-shadow duration-300
        dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]
        ${className}
      `}
      {...rest}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
