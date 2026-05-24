'use client'

export default function RecipeCard({ recipe }) {
  return (
    <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E3DED3]">
      <div className="flex justify-between items-start mb-3">
        <h3 className="serif text-[18px] leading-tight flex-1 pr-2">{recipe.name}</h3>
        <span className="text-[12px] text-[#9C9488] bg-[#F5F2EC] px-3 py-1 rounded-full flex-shrink-0">
          ⏱ {recipe.time}
        </span>
      </div>

      {recipe.urgentIngredients?.length > 0 && (
        <div className="bg-[#FAEAE6] rounded-lg p-2 mb-3 text-[12px] text-[#C94A2E] font-medium">
          ⚡ Aprovecha: {recipe.urgentIngredients.join(', ')} que vence pronto
        </div>
      )}

      <p className="text-[13px] text-[#6B6559] leading-relaxed mb-3">{recipe.description}</p>

      {recipe.steps?.length > 0 && (
        <details className="group">
          <summary className="text-[12px] font-medium text-[#9C9488] cursor-pointer list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Ver pasos
          </summary>
          <ol className="mt-2 space-y-1">
            {recipe.steps.map((step, i) => (
              <li key={i} className="text-[12px] text-[#6B6559] flex gap-2">
                <span className="text-[#C94A2E] font-semibold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}