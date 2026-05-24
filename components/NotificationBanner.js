'use client'
import { useState, useEffect } from 'react'
import { permissionStatus, requestPermission, scheduleNotifications } from '@/lib/notifications'

export default function NotificationBanner({ products }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus(permissionStatus())
  }, [])

  async function handleEnable() {
    const granted = await requestPermission()
    setStatus(granted ? 'granted' : 'denied')
    if (granted) scheduleNotifications(products)
  }

  if (status === 'loading' || status === 'granted' || status === 'unsupported') return null

  if (status === 'denied') return (
    <div className="mx-6 mt-4 p-3 rounded-xl bg-[#FBF2E2] border border-[#C47B1A]/20 text-[12px] text-[#854F0B]">
      <span className="font-medium">Notificaciones bloqueadas.</span> Actívalas en Configuración → Notificaciones → Despensa IA.
    </div>
  )

  return (
    <div className="mx-6 mt-4 p-3 rounded-xl bg-[#E5F3EC] border border-[#3A7D52]/20 flex items-center justify-between gap-3">
      <div>
        <div className="text-[13px] font-medium text-[#27500A]">Activar alertas de vencimiento</div>
        <div className="text-[11px] text-[#3B6D11] mt-0.5">Te avisamos cuando algo está por vencer</div>
      </div>
      <button
        onClick={handleEnable}
        className="flex-shrink-0 px-3 py-1.5 bg-[#3A7D52] text-white text-[12px] font-medium rounded-lg active:scale-95 transition-transform">
        Activar
      </button>
    </div>
  )
}