import { useCallback, useRef, useState } from 'react'
import type { IngestProgress, IngestResult } from '@/api/types'

export function useIngestion() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<IngestProgress | null>(null)
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(null)
    setResult(null)
    setError(null)
    wsRef.current?.close()
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<IngestResult> => {
    setIsUploading(true)
    setProgress(null)
    setResult(null)
    setError(null)

    return new Promise((resolve, reject) => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const wsUrl = `${wsProtocol}://${window.location.host}/ws/ingest`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
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
          if (data.type === 'result' || data.stage === 'done') {
            const r: IngestResult = {
              document_name: file.name,
              tags_created: data.tags_created ?? [],
              tags_updated: data.tags_updated ?? [],
              total_items_added: data.total_items_added ?? 0,
              duration_seconds: data.duration_seconds ?? 0,
              duplicate_items_skipped: data.duplicate_items_skipped ?? 0,
            }
            setResult(r)
            setIsUploading(false)
            resolve(r)
          } else if (data.error) {
            setError(data.error)
            setIsUploading(false)
            reject(new Error(data.error))
          } else {
            setProgress(data as IngestProgress)
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = async () => {
        // REST fallback
        try {
          const form = new FormData()
          form.append('file', file)
          setProgress({ stage: 'extracting', document_name: file.name })
          const res = await fetch('/api/ingest', { method: 'POST', body: form })
          if (!res.ok) throw new Error(await res.text())
          const data = await res.json()
          const r: IngestResult = {
            document_name: file.name,
            tags_created: data.tags_created ?? [],
            tags_updated: data.tags_updated ?? [],
            total_items_added: data.total_items_added ?? 0,
            duration_seconds: data.duration_seconds ?? 0,
            duplicate_items_skipped: data.duplicate_items_skipped ?? 0,
          }
          setResult(r)
          setIsUploading(false)
          resolve(r)
        } catch (err: any) {
          const msg = err.message || 'Ingestion failed'
          setError(msg)
          setIsUploading(false)
          reject(err)
        }
      }

      ws.onclose = () => {
        setIsUploading(false)
      }
    })
  }, [])

  return { isUploading, progress, result, error, uploadFile, reset }
}
