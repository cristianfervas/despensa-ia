'use client'
import { useState, useEffect, useCallback } from 'react'
import { getProducts, addProduct, deleteProduct, updateProduct, daysLeft, statusOf, getShoppingList, saveShoppingList, toggleShoppingItem, removeShoppingItem } from '@/lib/storage'
import ProductCard from '@/components/ProductCard'
import RecipeCard from '@/components/RecipeCard'
import AddPanel from '@/components/AddPanel'
import EditPanel from '@/components/EditPanel'
import ShoppingList from '@/components/ShoppingList'
import NotificationBanner from '@/components/NotificationBanner'
import { scheduleNotifications } from '@/lib/notifications'

export default function Home() {
  const [products, setProducts] = useState([])
  const [tab, setTab] = useState('despensa')
  const [showAdd, setShowAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [shoppingItems, setShoppingItems] = useState([])
  const [loadingShoping, setLoadingShoping] = useState(false)
  const [addingFromShopping, setAddingFromShopping] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setProducts(getProducts())
    setShoppingItems(getShoppingList())
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      scheduleNotifications(products)
    }
  }, [products])

  const refresh = useCallback(() => {
    setProducts(getProducts())
  }, [])

  function handleAdd(product) {
    addProduct(product)
    refresh()
    showToast(`${product.emoji} ${product.name} agregado`)
    if (addingFromShopping) {
      removeShoppingItem(addingFromShopping.id)
      setShoppingItems(prev => prev.filter(i => i.id !== addingFromShopping.id))
      setAddingFromShopping(null)
    }
  }

  function handleEdit(product) {
    setEditingProduct(product)
  }

  function handleUpdate(id, changes) {
    updateProduct(id, changes)
    setEditingProduct(null)
    refresh()
    showToast('Producto actualizado')
  }

  function handleDelete(id) {
    deleteProduct(id)
    setEditingProduct(null)
    refresh()
    showToast('Producto eliminado')
  }

  async function fetchShoppingList() {
    setLoadingShoping(true)
    try {
      const enriched = products.map(p => ({ ...p, status: statusOf(daysLeft(p.expiry)) }))
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: enriched }),
      })
      const data = await res.json()
      const items = (data.items || []).map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        done: false,
      }))
      setShoppingItems(items)
      saveShoppingList(items)
    } catch {
      showToast('Error al generar la lista')
    } finally {
      setLoadingShoping(false)
    }
  }

  function handleShoppingTab() {
    setTab('compras')
    if (shoppingItems.length === 0) fetchShoppingList()
  }

  function handleToggle(id) {
    toggleShoppingItem(id)
    setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function handleAddToDispensa(item) {
    setAddingFromShopping(item)
  }

  function handleClearDone() {
    const filtered = shoppingItems.filter(i => !i.done)
    setShoppingItems(filtered)
    saveShoppingList(filtered)
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
      <div className="sticky top-0 z-20 bg-[#F5F2EC] border-b border-[#EDE9E0] px-6 pt-10 pb-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="serif text-[26px] leading-none">
            Des<span className="text-[#C94A2E] italic">pensa</span>
          </h1>
          <div className="w-8 h-8 rounded-full bg-[#1C1A16] text-white flex items-center justify-center text-[13px] font-medium">
            C
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

      {/* Banner de notificaciones */}
      <NotificationBanner products={products} />

      {/* Content */}
      <div className="px-4 pb-[100px] pt-5">
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
                <div className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3 mt-2 bg-[#FAEAE6] text-[#C94A2E]">
                  🔴 Usar hoy
                </div>
                {urgent.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onEdit={handleEdit} />
                ))}
              </>
            )}
            {warn.length > 0 && (
              <>
                {urgent.length > 0 && <div className="h-2" />}
                <div className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3 mt-3 bg-[#FBF2E2] text-[#C47B1A]">
                  🟡 Usar pronto
                </div>
                {warn.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onEdit={handleEdit} />
                ))}
              </>
            )}
            {ok.length > 0 && (
              <>
                {(urgent.length > 0 || warn.length > 0) && <div className="h-2" />}
                <div className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3 mt-3 bg-[#E5F3EC] text-[#3A7D52]">
                  🟢 Todo bien
                </div>
                {ok.sort((a,b) => daysLeft(a.expiry) - daysLeft(b.expiry)).map(p => (
                  <ProductCard key={p.id} product={p} onEdit={handleEdit} />
                ))}
              </>
            )}
          </>
        )}

        {tab === 'compras' && (
          <ShoppingList
            items={shoppingItems}
            loading={loadingShoping}
            onToggle={handleToggle}
            onAddToDispensa={handleAddToDispensa}
            onRegenerate={fetchShoppingList}
            onClearDone={handleClearDone}
          />
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
        className="fixed bottom-24 right-5 bg-[#C94A2E] text-white px-5 py-3 rounded-2xl text-[22px] font-light shadow-lg z-40 active:scale-95 transition-transform flex items-center justify-center w-14 h-14">
        +
      </button>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#EDE9E0] z-40 flex"
        style={{ padding: '8px 0 20px' }}>
        {[
          { key: 'despensa', emoji: '🥡', label: 'Despensa', onClick: () => setTab('despensa') },
          { key: 'recetas',  emoji: '👨‍🍳', label: 'Recetas',  onClick: fetchRecipes },
          { key: 'compras',  emoji: '🛒', label: 'Compras',  onClick: handleShoppingTab },
        ].map(item => {
          const active = tab === item.key
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex-1 flex flex-col items-center gap-1">
              <span
                className="flex items-center justify-center text-[18px]"
                style={active
                  ? { width: 32, height: 32, borderRadius: 10, background: '#1C1A16' }
                  : { width: 32, height: 32 }}>
                {item.emoji}
              </span>
              <span className="text-[10px] font-medium" style={{ color: active ? '#1C1A16' : '#9C9488' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {(showAdd || addingFromShopping) && (
        <AddPanel
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); setAddingFromShopping(null) }}
          initialName={addingFromShopping?.name ?? ''}
          initialEmoji={addingFromShopping?.emoji ?? ''}
        />
      )}
      {editingProduct && (
        <EditPanel
          product={editingProduct}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1C1A16] text-white text-[13px] font-medium px-5 py-3 rounded-full z-50 shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  )
}