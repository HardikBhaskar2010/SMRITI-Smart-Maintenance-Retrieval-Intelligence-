import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error'

interface UseVoiceOptions {
  onResult: (transcript: string) => void
  onError?: (msg: string) => void
  silenceMs?: number
  /** BCP-47 language code. Default: 'hi-IN' for Hinglish */
  language?: string
}

export function useVoice({ onResult, onError, silenceMs = 1500, language = 'hi-IN' }: UseVoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const stopListening = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    recognitionRef.current?.stop()
    setStatus('idle')
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition not supported in this browser. Please use Chrome.')
      setStatus('error')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = language

    rec.onstart = () => setStatus('listening')

    rec.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalTranscript += result[0].transcript
        else interimTranscript += result[0].transcript
      }
      const combined = (finalTranscript || interimTranscript).trim()
      setTranscript(combined)

      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      if (combined) {
        silenceTimer.current = setTimeout(() => {
          stopListening()
          onResult(combined)
        }, silenceMs)
      }
    }

    rec.onerror = (event: any) => {
      setStatus('error')
      if (event.error === 'not-allowed') {
        onError?.('Microphone permission denied. Use text input instead.')
      } else {
        onError?.(`Speech recognition error: ${event.error}`)
      }
    }

    rec.onend = () => {
      if (recognitionRef.current === rec) setStatus('idle')
    }

    recognitionRef.current = rec
    rec.start()
  }, [isSupported, onResult, onError, silenceMs, language, stopListening])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  return {
    status,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    isSupported,
    isListening: status === 'listening',
  }
}
