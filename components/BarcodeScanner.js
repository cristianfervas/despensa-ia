'use client'
import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetect }) {
  const [status, setStatus] = useState('init') // init | scanning | loading | error | notfound
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef(null)
  const scannerDivId = 'barcode-scanner-view'

  useEffect(() => {
    let html5QrCode

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      html5QrCode = new Html5Qrcode(scannerDivId)
      scannerRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 120 } },
        async (code) => {
          await html5QrCode.stop()
          setStatus('loading')
          try {
            const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`)
            const data = await res.json()
            if (res.ok) {
              onDetect({ ...data, date: new Date().toISOString().split('T')[0] })
            } else {
              setStatus('notfound')
              setErrorMsg(code)
            }
          } catch {
            setStatus('error')
          }
        },
        () => {}
      ).then(() => setStatus('scanning'))
        .catch(() => {
          setStatus('error')
          setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos.')
        })
    })

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div>
      {/* El div siempre está en el DOM con tamaño real para que la librería pueda renderizar el video */}
      <div
        id={scannerDivId}
        className="rounded-2xl overflow-hidden mb-3"
        style={{ display: status === 'scanning' || status === 'init' ? 'block' : 'none' }}
      />

      {status === 'init' && (
        <div className="py-4 text-center text-[#9C9488] text-[14px]">Iniciando cámara...</div>
      )}

      {status === 'scanning' && (
        <p className="text-center text-[12px] text-[#9C9488]">
          Apunta la cámara al código de barras del producto
        </p>
      )}

      {status === 'loading' && (
        <div className="py-10 text-center">
          <div className="text-3xl mb-2 animate-spin">⏳</div>
          <p className="text-[14px] text-[#6B6559]">Buscando producto...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="border-2 border-dashed border-[#E3DED3] rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-2">🚫</span>
          <p className="text-[14px] font-medium text-[#6B6559] mb-1">Sin acceso a la cámara</p>
          <p className="text-[12px] text-[#9C9488]">{errorMsg || 'Revisa los permisos del navegador'}</p>
        </div>
      )}

      {status === 'notfound' && (
        <div className="border-2 border-dashed border-[#E3DED3] rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-[14px] font-medium text-[#6B6559] mb-1">Producto no encontrado</p>
          <p className="text-[12px] text-[#9C9488] mb-3">Código: {errorMsg}</p>
          <p className="text-[12px] text-[#9C9488]">Agrégalo manualmente con la pestaña Manual</p>
        </div>
      )}
    </div>
  )
}
