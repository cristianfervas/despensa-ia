'use client'
import { useState } from 'react'
import { lookupDuracion, esFrutaVerdura, getQuantityType } from '@/lib/storage'

const EMOJIS = ['🥩','🥛','🥚','🥬','🍎','🧀','🐟','🍞','🫙','🧄','🍋','🥕','🍅','🥦','🧅']

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

export default function EditPanel({ product, onSave, onDelete, onClose }) {
  // Determinar estado inicial de duración
  const initialBase = lookupDuracion(product.name)
  const matchesCurrent = initialBase !== null && initialBase === product.days

  // Estado inicial de cantidad (compatible con productos sin estos campos)
  const initQtyType = product.quantityType ?? getQuantityType(product.name)
  const initQuantity = product.quantity ?? (initQtyType === 'weight' ? 500 : 1)
  const initQtyUnit = product.quantityUnit === 'kg' ? 'kg' : 'g'

  const [emoji, setEmoji] = useState(product.emoji)
  const [name, setName] = useState(product.name)
  const [date, setDate] = useState(product.date)
  const [days, setDays] = useState(product.days)
  const [autoBaseDays, setAutoBaseDays] = useState(matchesCurrent ? initialBase : null)
  const [maturity, setMaturity] = useState('fresh')
  const [showDurationSelect, setShowDurationSelect] = useState(!matchesCurrent)
  const [quantityType, setQuantityType] = useState(initQtyType)
  const [quantity, setQuantity] = useState(initQuantity)
  const [quantityUnit, setQuantityUnit] = useState(initQtyUnit)

  function handleNameChange(value) {
    setName(value)
    const base = lookupDuracion(value)
    setAutoBaseDays(base)
    if (base !== null) {
      setDays(applyMaturity(base, maturity))
      setShowDurationSelect(false)
    } else {
      setShowDurationSelect(true)
    }
    // Quantity type auto-detect al cambiar nombre
    const newQtyType = getQuantityType(value)
    if (newQtyType !== quantityType) {
      setQuantityType(newQtyType)
      setQuantity(newQtyType === 'weight' ? 500 : 1)
      setQuantityUnit('g')
    }
  }

  function handleMaturityChange(newMaturity) {
    setMaturity(newMaturity)
    if (autoBaseDays !== null) setDays(applyMaturity(autoBaseDays, newMaturity))
  }

  function handleSave() {
    if (!name.trim()) return alert('El nombre no puede estar vacío')
    onSave(product.id, {
      emoji, name: name.trim(), date, days: parseInt(days),
      quantityType, quantity, quantityUnit: quantityType === 'unit' ? 'u' : quantityUnit,
    })
  }

  function handleDeleteClick() {
    if (window.confirm(`¿Eliminar ${product.name}?`)) onDelete(product.id)
  }

  const hasAuto = autoBaseDays !== null
  const showMaturity = hasAuto && !showDurationSelect && esFrutaVerdura(name)
  const showAutoInfo = hasAuto && !showDurationSelect

  // Si el valor actual de days no está en las opciones, lo agrega dinámicamente
  const selectOptions = DURATION_OPTIONS.some(o => o.value === days)
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, { value: days, label: `${days} días` }].sort((a, b) => a.value - b.value)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F5F2EC] rounded-t-3xl p-6 w-full max-w-[430px] mx-auto animate-slide-up">
        <div className="w-10 h-1 bg-[#E3DED3] rounded mx-auto mb-5" />
        <h2 className="serif text-[22px] mb-5">Editar producto</h2>

        {/* Emoji picker */}
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJIS.map(e => (
            <button key={e}
              onClick={() => setEmoji(e)}
              className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border-2 transition-all
                ${emoji === e ? 'border-[#C94A2E] bg-[#FAEAE6]' : 'border-[#E3DED3] bg-white'}`}>
              {e}
            </button>
          ))}
        </div>

        {/* Nombre */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Nombre</label>
          <input
            className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
          />
        </div>

        {/* Selector de madurez — solo frutas y verduras en modo auto */}
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

        {/* Cantidad */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Cantidad restante</label>
          {quantityType === 'unit' ? (
            <div className="flex items-center gap-2 h-11">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-[#E3DED3] flex items-center justify-center text-[18px] font-medium text-[#1C1A16] active:scale-95 transition-transform select-none">
                −
              </button>
              <div className="min-w-[80px] h-10 flex items-center justify-center bg-white border border-[#E3DED3] rounded-xl text-[14px] font-medium text-[#1C1A16] px-2">
                {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                className="w-10 h-10 rounded-xl bg-white border border-[#E3DED3] flex items-center justify-center text-[18px] font-medium text-[#1C1A16] active:scale-95 transition-transform select-none">
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={quantityUnit === 'g' ? 1 : 0.001}
                step={quantityUnit === 'g' ? 1 : 0.001}
                inputMode="decimal"
                className="flex-1 px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
                value={quantity}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > 0) setQuantity(val)
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (quantityUnit === 'g') {
                    setQuantityUnit('kg')
                    setQuantity(q => parseFloat((q / 1000).toFixed(3)))
                  } else {
                    setQuantityUnit('g')
                    setQuantity(q => Math.round(q * 1000))
                  }
                }}
                className="px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[14px] font-semibold text-[#1C1A16] min-w-[56px] text-center active:scale-95 transition-transform">
                {quantityUnit}
              </button>
            </div>
          )}
        </div>

        {/* Fecha de compra */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9488] mb-1.5">Fecha de compra</label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-[#E3DED3] rounded-xl text-[15px] outline-none focus:border-[#C94A2E]"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Duración — info automática o selector */}
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
              {selectOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-[#1C1A16] text-white rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform mb-3">
          Guardar cambios
        </button>

        {/* Eliminar */}
        <button
          onClick={handleDeleteClick}
          className="w-full py-3.5 bg-[#FAEAE6] text-[#C94A2E] rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform">
          Eliminar producto
        </button>
      </div>
    </div>
  )
}
