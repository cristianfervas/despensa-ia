'use client'
import { useState } from 'react'
import { today, lookupDuracion, esFrutaVerdura, getEmoji, EMOJI_CATEGORIES } from '@/lib/storage'
import BarcodeScanner from './BarcodeScanner'

const DURATION_OPTIONS = [
  { value: 1,   label: '1 día' },  { value: 2,   label: '2 días' },
  { value: 3,   label: '3 días' },  { value: 4,   label: '4 días' },
  { value: 5,   label: '5 días' },  { value: 6,   label: '6 días' },
  { value: 7,   label: '7 días' },  { value: 8,   label: '8 días' },
  { value: 9,   label: '9 días' },  { value: 10,  label: '10 días' },
  { value: 13,  label: '13 días' }, { value: 14,  label: '14 días' },
  { value: 18,  label: '18 días' }, { value: 21,  label: '21 días' },
  { value: 30,  label: '30 días' }, { value: 90,  label: '3 meses' },
  { value: 180, label: '6 meses' }, { value: 365, label: '1 año' },
  { value: 730, label: '2 años' },
]

const MATURITY_OPTIONS = [
  { id: 'fresh',    label: 'Fresco',     emoji: '🟢', mult: 1,   active: 'border-[#3A7D52] bg-[#EAF2EE] text-[#3A7D52]' },
  { id: 'ripe',     label: 'Maduro',     emoji: '🟡', mult: 0.6, active: 'border-[#C47B1A] bg-[#FEF3DC] text-[#C47B1A]' },
  { id: 'overripe', label: 'Muy maduro', emoji: '🔴', mult: 0.3, active: 'border-[#C94A2E] bg-[#FAEAE6] text-[#C94A2E]' },
]

function applyMaturity(base, maturity) {
  const mult = MATURITY_OPTIONS.find(m => m.id === maturity)?.mult ?? 1
  return Math.max(1, Math.round(base * mult))
}

export default function AddPanel({ onAdd, onClose, initialName = '', initialEmoji = '' }) {
  const initBase    = initialName ? lookupDuracion(initialName) : null
  const initEmoji   = initialEmoji || getEmoji(initialName) || '🥩'
  const initHasSugg = !!(initialEmoji || getEmoji(initialName))

  const [method, setMethod] = useState('manual')
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initEmoji)
  const [showGrid, setShowGrid] = useState(!initHasSugg)
  const [emojiPulsed, setEmojiPulsed] = useState(false)
  const [date, setDate] = useState(today())
  const [days, setDays] = useState(initBase ?? 3)
  const [autoBaseDays, setAutoBaseDays] = useState(initBase)
  const [maturity, setMaturity] = useState('fresh')
  const [showDurationSelect, setShowDurationSelect] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  function handleNameChange(value) {
    setName(value)
    // Emoji auto-suggest
    const suggested = getEmoji(value)
    if (suggested) {
      setEmoji(suggested)
      setShowGrid(false)
    }
    // Duration auto-detect
    const base = lookupDuracion(value)
    setAutoBaseDays(base)
    if (base !== null) {
      setDays(applyMaturity(base, maturity))
      setShowDurationSelect(false)
    }
  }

  function handleMaturityChange(newMaturity) {
    setMaturity(newMaturity)
    if (autoBaseDays !== null) setDays(applyMaturity(autoBaseDays, newMaturity))
  }

  function handleEmojiTap() {
    setEmojiPulsed(true)
    setTimeout(() => setEmojiPulsed(false), 180)
  }

  function handleSubmit() {
    if (!name.trim()) return alert('Escribe el nombre del producto')
    onAdd({ emoji, name: name.trim(), date, days: parseInt(days) })
    setName(''); setEmoji('🥩'); setShowGrid(true); setEmojiPulsed(false)
    setDate(today()); setDays(3); setAutoBaseDays(null)
    setMaturity('fresh'); setShowDurationSelect(false)
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
      if (data.products?.length) { data.products.forEach(p => onAdd(p)); onClose() }
    } catch {
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

  const hasAuto      = autoBaseDays !== null
  const hasSuggestion = !!getEmoji(name)
  const showMaturity  = hasAuto && !showDurationSelect && esFrutaVerdura(name)
  const showAutoInfo  = hasAuto && !showDurationSelect
  const showSelect    = !hasAuto || showDurationSelect

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F5F2EC] rounded-t-3xl p-6 w-full max-w-[430px] mx-auto animate-slide-up">
        <div className="w-10 h-1 bg-[#E3DED3] rounded mx-auto mb-5" />
        <h2 className="serif text-[22px] mb-5">Agregar producto</h2>

        {/* Tabs de método */}
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
            {/* 1 — Nombre */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Nombre</label>
              <input
                className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                placeholder="ej: Pollo, Leche, Tomate..."
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* 2 — Ícono: sugerencia grande o grid de categorías */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Ícono</label>

              {!showGrid ? (
                /* Círculo de sugerencia */
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleEmojiTap}
                    className={`w-16 h-16 rounded-2xl bg-[#F5F2EC] border-2 flex items-center justify-center text-4xl transition-all duration-150 select-none
                      ${emojiPulsed ? 'scale-110 border-[#3A7D52]' : 'scale-100 border-[#E3DED3]'}`}>
                    {emoji}
                  </button>
                  <div>
                    <p className="text-[12px] text-[#6B6559] mb-1.5">
                      {hasSuggestion ? 'Ícono sugerido' : 'Ícono seleccionado'}
                    </p>
                    <button
                      onClick={() => setShowGrid(true)}
                      className="text-[12px] text-[#C94A2E] font-semibold">
                      Cambiar ícono
                    </button>
                  </div>
                </div>
              ) : (
                /* Grid de categorías */
                <div className="bg-white border border-[#E3DED3] rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl leading-none">{emoji}</span>
                      <span className="text-[11px] text-[#9C9488]">Seleccionado</span>
                    </div>
                    {hasSuggestion && (
                      <button
                        onClick={() => setShowGrid(false)}
                        className="text-[12px] text-[#C94A2E] font-semibold">
                        Cerrar
                      </button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {EMOJI_CATEGORIES.map(cat => (
                      <div key={cat.label} className="mb-3 last:mb-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">
                          {cat.label}
                        </p>
                        <div className="grid grid-cols-6 gap-1">
                          {cat.emojis.map(e => (
                            <button
                              key={e}
                              onClick={() => { setEmoji(e); setShowGrid(false) }}
                              className={`h-9 rounded-lg text-2xl flex items-center justify-center transition-all
                                ${emoji === e
                                  ? 'bg-[#FAEAE6] ring-2 ring-inset ring-[#C94A2E]'
                                  : 'bg-[#F5F2EC] active:scale-90'}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3 — Selector de madurez (solo frutas y verduras) */}
            {showMaturity && (
              <div className="mb-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Estado</label>
                <div className="flex gap-2">
                  {MATURITY_OPTIONS.map(m => (
                    <button key={m.id}
                      onClick={() => handleMaturityChange(m.id)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all
                        ${maturity === m.id ? m.active : 'border-[#E3DED3] bg-white text-[#6B6559]'}`}>
                      <span className="block text-base mb-0.5">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 — Fecha de compra */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Fecha de compra</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {/* 5 — Duración */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Duración estimada</label>
              {showAutoInfo ? (
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#E3DED3] rounded-xl">
                  <span className="text-[15px] text-[#1C1A16]">{days} {days === 1 ? 'día' : 'días'}</span>
                  <button onClick={() => setShowDurationSelect(true)} className="text-[12px] text-[#C94A2E] font-semibold">
                    Ajustar
                  </button>
                </div>
              ) : (
                <select
                  className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                  value={days}
                  onChange={e => setDays(parseInt(e.target.value))}>
                  {DURATION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
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

        {/* Barcode scanner */}
        {method === 'barcode' && (
          <BarcodeScanner onDetect={p => { onAdd(p); onClose() }} />
        )}
      </div>
    </div>
  )
}
