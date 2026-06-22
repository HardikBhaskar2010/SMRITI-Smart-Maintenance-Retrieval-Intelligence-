import { useCallback, useRef, useState } from 'react'
import type { IngestProgress } from '@/api/types'

interface UseIngestionOptions {
  onProgress?: (progress: IngestProgress) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

export function useIngestion({ onProgress, onComplete, onError }: UseIngestionOptions = {}) {
  const [isIngesting, setIsIngesting] = useState(false)
  const [progress, setProgress] = useState<IngestProgress | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const ingest = useCallback(async (file: File) => {
    setIsIngesting(true)
    setProgress(null)

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/ingest`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = async () => {
      // Convert file to base64 and send as JSON
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        ws.send(JSON.stringify({ filename: file.name, file_data: base64 }))
      }
      reader.readAsDataURL(file)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'result') {
          setIsIngesting(false)
          onComplete?.(data)
        } else {
          const prog = data as IngestProgress
          setProgress(prog)
          onProgress?.(prog)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      setIsIngesting(false)
      onError?.('WebSocket connection failed. Trying REST fallback...')
      _ingestFallback(file, onProgress, onComplete, onError)
    }

    ws.onclose = () => {
      setIsIngesting(false)
    }
  }, [onProgress, onComplete, onError])

  const cancel = useCallback(() => {
    wsRef.current?.close()
    setIsIngesting(false)
  }, [])

  return { isIngesting, progress, ingest, cancel }
}

async function _ingestFallback(
  file: File,
  onProgress?: (p: IngestProgress) => void,
  onComplete?: (r: any) => void,
  onError?: (e: string) => void,
) {
  try {
    onProgress?.({ stage: 'extracting', document_name: file.name })
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/ingest', { method: 'POST', body: form })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    onProgress?.({ stage: 'done', document_name: file.name, items_embedded: data.total_items_added })
    onComplete?.(data)
  } catch (e: any) {
    onError?.(e.message || 'Ingestion failed')
  }
}
