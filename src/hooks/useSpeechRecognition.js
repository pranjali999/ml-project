import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Web Speech API — Chrome/Edge/Safari (limited). Graceful fallback.
 */
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const supported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-IN'

    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setTranscript(text.trim())
    }
    rec.onerror = (ev) => {
      setError(ev.error || 'speech_error')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    }
  }, [supported])

  const start = useCallback(() => {
    setError(null)
    setTranscript('')
    if (!recognitionRef.current) {
      setError('not_supported')
      return
    }
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setError('start_failed')
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  return { listening, transcript, error, start, stop, supported: !!supported }
}
