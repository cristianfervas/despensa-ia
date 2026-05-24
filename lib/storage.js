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