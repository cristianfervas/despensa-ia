'use client'
import { daysLeft, statusOf, badgeLabel, formatDate } from '@/lib/storage'

export default function ProductCard({ product, onDelete }) {
  const dl = daysLeft(product.expiry)
  const status = statusOf(dl)
  const label = badgeLabel(dl)

  const colors = {
    urgent: { border: 'border-l-[#C94A2E]', badge: 'bg-[#FAEAE6] text-[#C94A2E]' },
    warn:   { border: 'border-l-[#C47B1A]', badge: 'bg-[#FBF2E2] text-[#C47B1A]' },
    ok:     { border: 'border-l-[#3A7D52]', badge: 'bg-[#E5F3EC] text-[#3A7D52]' },
  }

  return (
    <div className={`bg-white rounded-2xl p-4 mb-2 flex items-center gap-3 border border-[#E3DED3] border-l-4 ${colors[status].border} active:scale-[0.98] transition-transform cursor-pointer`}
      onClick={() => onDelete && onDelete(product.id)}>
      <div className="w-12 h-12 rounded-xl bg-[#F5F2EC] flex items-center justify-center text-2xl flex-shrink-0">
        {product.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium truncate">{product.name}</div>
        <div className="text-[12px] text-[#9C9488] mt-0.5">
          Comprado {formatDate(product.date)} · {product.days}d duración
        </div>
      </div>
      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full flex-shrink-0 ${colors[status].badge}`}>
        {label}
      </span>
    </div>
  )
}