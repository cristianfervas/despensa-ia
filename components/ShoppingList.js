'use client'

const PRIORITY = {
  urgent: { label: 'Urgente', badge: 'bg-[#FAEAE6] text-[#C94A2E]' },
  warn:   { label: 'Pronto',  badge: 'bg-[#FBF2E2] text-[#C47B1A]' },
  ok:     { label: 'Falta',   badge: 'bg-[#E5F3EC] text-[#3A7D52]' },
}

const ORDER = { urgent: 0, warn: 1, ok: 2 }

export default function ShoppingList({ items, loading, onToggle, onAddToDispensa, onRegenerate, onClearDone }) {
  const hasDone = items.some(i => i.done)

  const sorted = [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (ORDER[a.priority] ?? 3) - (ORDER[b.priority] ?? 3)
  })

  return (
    <div>
      {/* Botones de acción */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onRegenerate}
          className="flex-1 py-2.5 bg-white border border-[#E3DED3] rounded-xl text-[13px] font-medium text-[#6B6559] active:scale-[0.98] transition-transform">
          ↻ Regenerar lista
        </button>
        <button
          onClick={onClearDone}
          disabled={!hasDone}
          className={`flex-1 py-2.5 bg-white border border-[#E3DED3] rounded-xl text-[13px] font-medium transition-transform
            ${hasDone ? 'text-[#6B6559] active:scale-[0.98]' : 'text-[#C8C2B8] cursor-default'}`}>
          ✕ Limpiar tachados
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-[#9C9488]">
          <div className="text-4xl mb-3 animate-bounce">🛒</div>
          <div className="text-[14px]">Claude está analizando tu despensa...</div>
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-[#9C9488]">
          <div className="text-5xl mb-3">🛒</div>
          <div className="serif text-[20px] text-[#6B6559] mb-2">Lista vacía</div>
          <div className="text-[13px]">Toca "Regenerar lista" para generar sugerencias</div>
        </div>
      )}

      {/* Items */}
      {!loading && sorted.map(item => {
        const cfg = PRIORITY[item.priority] ?? PRIORITY.ok
        return (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-4 mb-2 border border-[#E3DED3] transition-opacity ${item.done ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              {/* Checkbox custom */}
              <button
                onClick={() => onToggle(item.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${item.done ? 'bg-[#3A7D52] border-[#3A7D52]' : 'bg-white border-[#C8C2B8]'}`}>
                {item.done && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg leading-none">{item.emoji}</span>
                  <span className={`text-[15px] font-medium ${item.done ? 'line-through text-[#9C9488]' : 'text-[#1C1A16]'}`}>
                    {item.name}
                  </span>
                  <span className="text-[12px] text-[#9C9488]">{item.quantity}</span>
                </div>
                <div className="text-[12px] text-[#9C9488] mt-0.5 truncate">{item.reason}</div>
              </div>

              {/* Badge prioridad */}
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Botón agregar a despensa — solo cuando está tachado */}
            {item.done && (
              <button
                onClick={() => onAddToDispensa(item)}
                className="mt-2.5 w-full py-2 bg-[#EAF2EE] rounded-xl text-[13px] font-semibold text-[#3A7D52] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform">
                Agregar a despensa →
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
