'use client'
import { useState } from 'react'

export default function RecipeCard({ recipe }) {
  const [expanded, setExpanded] = useState(false)
  const steps = recipe.steps || []
  const visibleSteps = expanded ? steps : steps.slice(0, 2)
  const hasMore = steps.length > 2

  return (
    <div className="rounded-[20px] overflow-hidden border border-[#EDE9E0] mb-3">
      {/* Hero */}
      <div className="bg-[#1C1A16] p-4">
        <div className="text-[48px] leading-none mb-2">{recipe.emoji || '🍽️'}</div>
        <h3 className="serif text-[17px] text-white leading-tight mb-2">{recipe.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {recipe.urgentIngredients?.map((ing, i) => (
            <span
              key={i}
              className="text-[9px] rounded-full"
              style={{ padding: '2px 8px', background: 'rgba(201,74,46,0.7)', color: 'white' }}>
              {ing}
            </span>
          ))}
          {recipe.time && (
            <span
              className="text-[9px] rounded-full"
              style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
              ⏱ {recipe.time}
            </span>
          )}
        </div>
      </div>

      {/* Pasos */}
      {steps.length > 0 && (
        <div className="bg-white px-4 py-3">
          <ol className="space-y-2">
            {visibleSteps.map((step, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span
                  className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ width: 20, height: 20, fontSize: 9, background: '#C94A2E' }}>
                  {i + 1}
                </span>
                <span className="text-[11px] text-[#6B6559] leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] text-[#9C9488] mt-3 font-medium">
              Ver todos los pasos →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
