const KEY = 'despensa-products'

export function getProducts() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveProducts(products) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(products))
}

export function addProduct(product) {
  const products = getProducts()
  const newProduct = {
    ...product,
    id: Date.now() + Math.random(),
    expiry: addDays(product.date, product.days),
  }
  saveProducts([...products, newProduct])
  return newProduct
}

export function deleteProduct(id) {
  const products = getProducts()
  saveProducts(products.filter(p => p.id !== id))
}

const SHOPPING_KEY = 'despensa-shopping'

export function getShoppingList() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SHOPPING_KEY) || '[]') } catch { return [] }
}

export function saveShoppingList(items) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(items))
}

export function toggleShoppingItem(id) {
  const items = getShoppingList()
  saveShoppingList(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
}

export function removeShoppingItem(id) {
  saveShoppingList(getShoppingList().filter(i => i.id !== id))
}

export function updateProduct(id, changes) {
  const products = getProducts()
  saveProducts(products.map(p => {
    if (p.id !== id) return p
    const days = changes.days ?? p.days
    const date = changes.date ?? p.date
    return { ...p, ...changes, expiry: addDays(date, days) }
  }))
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + parseInt(n))
  return d.toISOString().split('T')[0]
}

export function daysLeft(expiry) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const exp = new Date(expiry); exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / 86400000)
}

export function statusOf(dl) {
  if (dl <= 2) return 'urgent'
  if (dl <= 4) return 'warn'
  return 'ok'
}

export function badgeLabel(dl) {
  if (dl < 0) return `Venció hace ${Math.abs(dl)}d`
  if (dl === 0) return 'Vence hoy'
  if (dl === 1) return 'Mañana'
  return `${dl} días`
}

export function formatDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

// Duraciones base en días por producto (Chile)
export const PRODUCT_DURATIONS = {
  // Verduras
  tomate: 5, lechuga: 4, espinaca: 4, zanahoria: 14, brócoli: 5, brocoli: 5,
  cebolla: 30, ajo: 30, palta: 4, pepino: 7, pimentón: 7, pimenton: 7,
  choclo: 3, 'poroto verde': 5, acelga: 5, betarraga: 14,
  cilantro: 7, perejil: 7,
  // Frutas
  manzana: 21, pera: 7, plátano: 4, platano: 4, naranja: 14,
  limón: 21, limon: 21, durazno: 4, frutilla: 3,
  kiwi: 14, uva: 7, sandía: 7, sandia: 7, melón: 5, melon: 5,
  papaya: 4, frambuesa: 3, arándano: 7, arandano: 7,
  // Carnes
  pollo: 2, 'carne vacuno': 3, cerdo: 3, pavo: 2, cordero: 3,
  // Pescados y mariscos
  salmón: 2, salmon: 2, merluza: 2, 'atún fresco': 2, 'atun fresco': 2, camarones: 2,
  // Lácteos
  leche: 7, yogur: 10, 'queso fresco': 7, 'queso mantecoso': 14, mantequilla: 30, crema: 7,
  // Otros
  huevos: 21, pan: 3, marraqueta: 1,
  'conservas abiertas': 3, 'conservas cerradas': 730, arroz: 365, pasta: 365,
}

// Claves que corresponden a frutas o verduras frescas (muestran selector de madurez)
const FRUTAS_VERDURAS_KEYS = [
  'tomate', 'lechuga', 'espinaca', 'zanahoria', 'brócoli', 'brocoli',
  'cebolla', 'palta', 'pepino', 'pimentón', 'pimenton',
  'choclo', 'poroto verde', 'acelga', 'betarraga',
  'cilantro', 'perejil',
  'manzana', 'pera', 'plátano', 'platano', 'naranja',
  'limón', 'limon', 'durazno', 'frutilla',
  'kiwi', 'uva', 'sandía', 'sandia', 'melón', 'melon',
  'papaya', 'frambuesa', 'arándano', 'arandano',
]

// Devuelve días base para un nombre, o null si no hay coincidencia
export function lookupDuracion(nombre) {
  if (!nombre?.trim()) return null
  const lower = nombre.toLowerCase().trim()
  if (PRODUCT_DURATIONS[lower] !== undefined) return PRODUCT_DURATIONS[lower]
  // Substring: preferir la clave más larga que esté contenida en el nombre
  let best = null, bestLen = 0
  for (const [key, dias] of Object.entries(PRODUCT_DURATIONS)) {
    if (lower.includes(key) && key.length > bestLen) {
      best = dias
      bestLen = key.length
    }
  }
  return best
}

// True si el nombre corresponde a fruta o verdura fresca
export function esFrutaVerdura(nombre) {
  if (!nombre?.trim()) return false
  const lower = nombre.toLowerCase().trim()
  return FRUTAS_VERDURAS_KEYS.some(k => lower.includes(k))
}