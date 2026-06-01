'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Loader2, X, ScanLine } from 'lucide-react'

interface Props {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState('')
  const firedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()

    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
      if (firedRef.current) return
      if (result) {
        firedRef.current = true
        stopRef.current?.()
        onDetected(result.getText())
      }
    })
      .then(controls => {
        stopRef.current = () => controls.stop()
        setStarting(false)
      })
      .catch(() => {
        setStarting(false)
        setError('Camera access denied — please allow camera permission and try again.')
      })

    return () => { stopRef.current?.() }
  }, [onDetected])

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: '#000', aspectRatio: '4/3' }}>
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

      {/* Scanning overlay */}
      {!error && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-56 h-32">
            {/* Corner brackets */}
            {[
              'top-0 left-0 border-t-2 border-l-2',
              'top-0 right-0 border-t-2 border-r-2',
              'bottom-0 left-0 border-b-2 border-l-2',
              'bottom-0 right-0 border-b-2 border-r-2',
            ].map((cls, i) => (
              <div key={i} className={`absolute h-5 w-5 rounded-sm border-[#22C55E] ${cls}`} />
            ))}
            {/* Scanning line */}
            <div className="absolute left-1 right-1 h-0.5 rounded-full animate-scan-line" style={{ background: 'linear-gradient(90deg, transparent, #22C55E, transparent)' }} />
          </div>
        </div>
      )}

      {starting && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
            <p className="text-sm text-white/70">Starting camera…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div>
            <ScanLine className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      <button onClick={() => { stopRef.current?.(); onClose() }}
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:scale-110"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <X className="h-4 w-4" />
      </button>

      {!error && !starting && (
        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/60">
          Point at any food barcode
        </p>
      )}
    </div>
  )
}
