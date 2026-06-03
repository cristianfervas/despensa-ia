'use client'
import { daysLeft, statusOf, formatDate, formatQuantity } from '@/lib/storage'

export default function ProductCard({ product, onEdit }) {
  const dl = daysLeft(product.expiry)
  const status = statusOf(dl)
  const qty = formatQuantity(product)

  const colors = {
    urgent: '#C94A2E',
    warn:   '#C47B1A',
    ok:     '#3A7D52',
  }

  const dayColor = colors[status]

  return (
    <div className="bg-white rounded-2xl p-4 mb-2.5 mx-1 flex items-center gap-3 border border-[#E8E4DA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => onEdit && onEdit(product)}>
      <div className="w-12 h-12 rounded-xl bg-[#EDE9E0] flex items-center justify-center text-2xl flex-shrink-0">
        {product.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium truncate">{product.name}</div>
        <div className="text-[12px] text-[#9C9488] mt-0.5">
          Comprado {formatDate(product.date)}{qty ? ` · ${qty}` : ''} · {product.days}d duración
        </div>
      </div>
      {dl < 0 ? (
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#FAEAE6] text-[#C94A2E]">
            venció
          </span>
          <span className="text-[10px] text-[#9C9488] mt-0.5">
            hace {Math.abs(dl)}d
          </span>
        </div>
      ) : (
        <div className="flex-shrink-0 text-center leading-none" style={{ minWidth: 36 }}>
          <div className="serif font-bold" style={{ fontSize: 22, color: dayColor }}>
            {dl === 0 ? 'hoy' : dl}
          </div>
          {dl > 0 && (
            <div className="text-[8px] uppercase tracking-wider text-[#9C9488] mt-0.5">días</div>
          )}
        </div>
      )}
    </div>
  )
}
