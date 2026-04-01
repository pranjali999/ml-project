import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { getApiErrorMessage, chatbot } from '../services/api.js'

const seed = [
  {
    id: '1',
    role: 'assistant',
    text: 'Hi — I am your AgriMind copilot. Ask about crops, rainfall, or risk — replies come from POST /chatbot.',
  },
]

export default function Chatbot() {
  const [messages, setMessages] = useState(seed)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const uid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now())
    const userMsg = { id: uid, role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const data = await chatbot({ query: text })
      const reply =
        data.reply ||
        data.message ||
        (typeof data === 'string' ? data : JSON.stringify(data))
      const aid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + 1)
      setMessages((m) => [
        ...m,
        {
          id: aid,
          role: 'assistant',
          text: reply,
          source: data.source,
        },
      ])
    } catch (e) {
      const eid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + 2)
      setMessages((m) => [
        ...m,
        {
          id: eid,
          role: 'assistant',
          text: `Sorry — could not reach the API. ${getApiErrorMessage(e)}`,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card className="flex min-h-[520px] flex-col overflow-hidden p-0">
        <div className="border-b border-white/30 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display font-semibold text-slate-900 dark:text-white">
                AgriMind Assistant
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backend: POST /chatbot
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
                      : 'rounded-bl-md border border-white/40 bg-white/80 text-slate-800 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100'
                  }`}
                >
                  {m.text}
                  {m.source && (
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">
                      source: {m.source}
                    </p>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start gap-3 pl-11"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-slate-900/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Thinking…</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="border-t border-white/30 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={loading}
              placeholder="Ask anything about crops, weather, or profit…"
              className="flex-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
            />
            <Button type="button" onClick={send} icon={Send} className="shrink-0 px-4" disabled={loading}>
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
