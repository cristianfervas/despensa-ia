'use client'
import { useState } from 'react'
import { today } from '@/lib/storage'

const EMOJIS = ['🥩','🥛','🥚','🥬','🍎','🧀','🐟','🍞','🫙','🧄','🍋','🥕','🍅','🥦','🧅']

const DURATION_OPTIONS = [
  { value: 1,  label: '1 día — carne/pesca fresca' },
  { value: 3,  label: '3 días — carnes, lácteos abiertos' },
  { value: 5,  label: '5 días — frutas blandas, verduras de hoja' },
  { value: 7,  label: '7 días — quesos, embutidos' },
  { value: 14, label: '14 días — verduras duras, huevos' },
  { value: 30, label: '30 días — frutas duras, condimentos' },
  { value: 90, label: '90 días — conservas, congelados' },
]

export default function AddPanel({ onAdd, onClose }) {
  const [method, setMethod] = useState('manual')
  const [emoji, setEmoji] = useState('🥩')
  const [name, setName] = useState('')
  const [date, setDate] = useState(today())
  const [days, setDays] = useState(3)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  function handleSubmit() {
    if (!name.trim()) return alert('Escribe el nombre del producto')
    onAdd({ emoji, name: name.trim(), date, days: parseInt(days) })
    setName('')
    setEmoji('🥩')
    setDate(today())
    setDays(3)
    onClose()
  }

  async function handleBoleta(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setPreview(URL.createObjectURL(file))
    try {
      const base64 = await toBase64(file)
      const res = await fetch('/api/boleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      })
      const data = await res.json()
      if (data.products?.length) {
        data.products.forEach(p => onAdd(p))
        onClose()
      }
    } catch (err) {
      alert('Error al leer la boleta. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F5F2EC] rounded-t-3xl p-6 w-full max-w-[430px] mx-auto animate-slide-up">
        <div className="w-10 h-1 bg-[#E3DED3] rounded mx-auto mb-5" />
        <h2 className="serif text-[22px] mb-5">Agregar producto</h2>

        {/* Method tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'manual',  icon: '✏️', label: 'Manual' },
            { id: 'boleta',  icon: '📄', label: 'Boleta' },
            { id: 'barcode', icon: '📷', label: 'Código' },
          ].map(m => (
            <button key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border transition-all
                ${method === m.id ? 'bg-[#1C1A16] text-white border-[#1C1A16]' : 'bg-white text-[#6B6559] border-[#E3DED3]'}`}>
              <span className="block text-lg mb-0.5">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Manual */}
        {method === 'manual' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJIS.map(e => (
                <button key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all
                    ${emoji === e ? 'border-[#C94A2E] bg-[#FAEAE6] border-2' : 'border-[#E3DED3] bg-white'}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Nombre</label>
              <input
                className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                placeholder="ej: Pollo, Leche, Tomate..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Fecha de compra</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Duración estimada</label>
              <select
                className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                value={days}
                onChange={e => setDays(e.target.value)}>
                {DURATION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-[#1C1A16] text-white rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Agregar a la despensa
            </button>
          </div>
        )}

        {/* Boleta */}
        {method === 'boleta' && (
          <div>
            {preview ? (
              <img src={preview} alt="Boleta" className="w-full rounded-xl mb-4 max-h-48 object-cover" />
            ) : (
              <label className="block border-2 border-dashed border-[#E3DED3] rounded-2xl p-8 text-center cursor-pointer hover:border-[#C94A2E] transition-colors mb-4">
                <span className="text-4xl block mb-2">📄</span>
                <span className="text-[15px] font-medium text-[#6B6559] block mb-1">Fotografiar boleta</span>
                <span className="text-[12px] text-[#9C9488]">La IA extrae los productos automáticamente</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBoleta} />
              </label>
            )}
            {uploading && (
              <div className="text-center py-4 text-[14px] text-[#6B6559]">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                Claude está leyendo tu boleta...
              </div>
            )}
          </div>
        )}

        {/* Barcode placeholder */}
        {method === 'barcode' && (
          <div className="border-2 border-dashed border-[#E3DED3] rounded-2xl p-8 text-center mb-4">
            <span className="text-4xl block mb-2">📷</span>
            <span className="text-[15px] font-medium text-[#6B6559] block mb-1">Escaneo de código</span>
            <span className="text-[12px] text-[#9C9488]">Próximamente en la Fase 4</span>
          </div>
        )}
      </div>
    </div>
  )
}