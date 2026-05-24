'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getProducts, addProduct, deleteProduct, daysLeft, statusOf } from '@/lib/storage'
import ProductCard from '@/components/ProductCard'
import RecipeCard from '@/components/RecipeCard'
import AddPanel from '@/components/AddPanel'

export default function Home() {
  const [products, setProducts] = useState([])
  const [tab, setTab] = useState('despensa')
  const [showAdd, setShowAdd] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [toast, setToast] = useState(null)
  const [tabTop, setTabTop] = useState(0)
  const headerRef = useRef(null)

  useEffect(() => {
    setProducts(getProducts())
  }, [])

  useEffect(() => {
    if (!headerRef.current) return
    const observer = new ResizeObserver(() => {
      setTabTop(headerRef.current.offsetHeight)
    })
    observer.observe(headerRef.current)
    setTabTop(headerRef.current.offsetHeight)
    return () => observer.disconnect()
  }, [])

  const refresh = useCallback(() => {
    setProducts(getProducts())
  }, [])

  function handleAdd(product) {
    addProduct(product)
    refresh()
    showToast(`${product.emoji} ${product.name} agregado`)
  }

  function handleDelete(id) {
    const p = products.find(x => x.id === id)
    if (!p) return
    if (confirm(`¿Eliminar ${p.name}?`)) {
      deleteProduct(id)
      refresh()
      showToast('Producto eliminado')
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function fetchRecipes() {
    if (products.length === 0) return
    setLoadingRecipes(true)
    setTab('recetas')
    try {
      const enriched = products.map(p => ({
        ...p,
        status: statusOf(daysLeft(p.expiry)),
      }))
      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: enriched }),
      })
      const data = await res.json()
      setRecipes(data.recipes || [])
    } catch {
      showToast('Error al cargar recetas')
    } finally {
      setLoadingRecipes(false)
    }
  }

  const urgent = products.filter(p => statusOf(daysLeft(p.expiry)) === 'urgent')
  const warn   = products.filter(p => statusOf(daysLeft(p.expiry)) === 'warn')
  const ok     = products.filter(p => statusOf(daysLeft(p.expiry)) === 'ok')

  return (
    <>
      {/* Header */}
      <div ref={headerRef} className="sticky top-0 z-10 bg-[#F5F2EC] border-b border-[#E3DED3] px-6 pt-12 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="serif text-[26px] leading-none">
              Des<span className="text-[#C94A2E] italic">pensa</span>
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-[#9C9488] mt-1">Tu cocina inteligente</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Urgente', count: urgent.length, style: 'bg-[#FAEAE6] text-[#C94A2E]' },
            { label: 'Pronto',  count: warn.length,   style: 'bg-[#FBF2E2] text-[#C47B1A]' },
            { label: 'Ok',      count: ok.length,     style: 'bg-[#E5F3EC] text-[#3A7D52]' },
          ].map(s => (
            <div key={s.label} className={`flex-1 rounded-xl p-2.5 text-center ${s.style}`}>
              <div className="serif text-[20px] font-bold leading-none">{s.count}</div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs — top calculado dinámicamente según altura real del header */}
      <div
        className="flex border-b border-[#E3DED3] sticky z-10 bg-[#F5F2EC]"
        style={{ top: tabTop }}>
        <button
          onClick={() => setTab('despensa')}
          className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors
            ${tab === 'despensa' ? 'border-[#C94A2E] text-[#1C1A16]' : 'border-transparent text-[#9C9488]'}`}>
          🥡 Despensa
        </button>
        <button
          onClick={fetchRecipes}
          className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors
            ${tab === 'recetas' ? 'border-[#C94A2E] text-[#1C1A16]' : 'border-transparent text-[#9C9488]'}`}>
          👨‍🍳 Recetas IA
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pb-32 pt-5">
        {tab === 'despensa' && (
          <>
            {products.length === 0 && (
              <div className="text-center py-16 text-[#9C9488]">
                <div className="text-5xl mb-3">🛒</div>
                <div className="serif text-[20px] text-[#6B6559] mb-2">La despensa está vacía</div>
                <div className="text-[13px]">Toca el botón + para agregar productos</div>
              </div>
            )}
            {urgent.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9C9488]">🔴 Usar hoy</span>
                  <div className="flex-1 h-px bg-[#E3DED3]" />
                </div>
                {urgent.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onDelete={handleDelete} />
                ))}
              </>
            )}
            {warn.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9C9488]">🟡 Usar pronto</span>
                  <div className="flex-1 h-px bg-[#E3DED3]" />
                </div>
                {warn.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onDelete={handleDelete} />
                ))}
              </>
            )}
            {ok.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9C9488]">🟢 Todo bien</span>
                  <div className="flex-1 h-px bg-[#E3DED3]" />
                </div>
                {ok.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onDelete={handleDelete} />
                ))}
              </>
            )}
          </>
        )}

        {tab === 'recetas' && (
          <>
            {loadingRecipes && (
              <div className="text-center py-16 text-[#9C9488]">
                <div className="text-4xl mb-3 animate-bounce">👨‍🍳</div>
                <div className="text-[14px]">Claude está pensando qué cocinar...</div>
              </div>
            )}
            {!loadingRecipes && recipes.length === 0 && (
              <div className="text-center py-16 text-[#9C9488]">
                <div className="text-5xl mb-3">🍽️</div>
                <div className="serif text-[20px] text-[#6B6559] mb-2">Sin recetas aún</div>
                <div className="text-[13px]">Agrega productos a tu despensa primero</div>
              </div>
            )}
            {!loadingRecipes && recipes.map((r, i) => (
              <RecipeCard key={i} recipe={r} />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-7 right-6 w-14 h-14 bg-[#1C1A16] text-white rounded-full text-2xl shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform">
        +
      </button>

      {showAdd && <AddPanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1C1A16] text-white text-[13px] font-medium px-5 py-3 rounded-full z-50 shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  )
}