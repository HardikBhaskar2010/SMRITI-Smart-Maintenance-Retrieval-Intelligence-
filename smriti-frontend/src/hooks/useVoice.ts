import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error'

interface UseVoiceOptions {
  onResult: (transcript: string) => void
  onError?: (msg: string) => void
  silenceMs?: number
}

export function useVoice({ onResult, onError, silenceMs = 1500 }: UseVoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition not supported in this browser. Please use Chrome.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'hi-IN'   // Hinglish: Hindi locale with English code-switching

    rec.onstart = () => setStatus('listening')

    rec.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      const combined = (finalTranscript || interimTranscript).trim()
      setTranscript(combined)

      // Auto-submit after silence
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      if (combined) {
        silenceTimer.current = setTimeout(() => {
          stopListening()
          onResult(combined)
        }, silenceMs)
      }
    }

    rec.onerror = (event) => {
      setStatus('error')
      if (event.error === 'not-allowed') {
        onError?.('Microphone permission denied. Use text input instead.')
      }
    }

    rec.onend = () => {
      if (status === 'listening') setStatus('idle')
    }

    recognitionRef.current = rec
    rec.start()
  }, [isSupported, onResult, onError, silenceMs])

  const stopListening = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    recognitionRef.current?.stop()
    setStatus('idle')
  }, [])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  return { status, transcript, setTranscript, startListening, stopListening, isSupported }
}
