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
    quantityType: 'unit',
    quantity: 1,
    quantityUnit: 'u',
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

// Normaliza texto: minúsculas y sin tildes para matching insensible
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Mapa de palabras clave → tipo de medida (claves ya normalizadas, sin tildes)
export const QUANTITY_TYPE_MAP = {
  // unit (unidades)
  tomate: 'unit', lechuga: 'unit', palta: 'unit', manzana: 'unit', pera: 'unit',
  platano: 'unit', naranja: 'unit', limon: 'unit', durazno: 'unit', huevo: 'unit',
  cebolla: 'unit', ajo: 'unit', zapallo: 'unit', choclo: 'unit', pimenton: 'unit',
  pepino: 'unit', zanahoria: 'unit', brocoli: 'unit', coliflor: 'unit',
  betarraga: 'unit', alcachofa: 'unit', frutilla: 'unit', uva: 'unit', kiwi: 'unit',
  mandarina: 'unit', ciruela: 'unit', pan: 'unit', marraqueta: 'unit',
  hallulla: 'unit', yogur: 'unit',
  // weight (gramos/kilos)
  pollo: 'weight', pechuga: 'weight', carne: 'weight', vacuno: 'weight',
  cerdo: 'weight', cordero: 'weight', salmon: 'weight', merluza: 'weight',
  atun: 'weight', pescado: 'weight', camaron: 'weight', arroz: 'weight',
  pasta: 'weight', harina: 'weight', avena: 'weight', quinoa: 'weight',
  lenteja: 'weight', garbanzo: 'weight', poroto: 'weight', queso: 'weight',
  mantequilla: 'weight', crema: 'weight',
}

export function getQuantityType(name) {
  if (!name?.trim()) return 'unit'
  const norm = normalize(name)
  if (QUANTITY_TYPE_MAP[norm] !== undefined) return QUANTITY_TYPE_MAP[norm]
  let best = null, bestLen = 0
  for (const [key, type] of Object.entries(QUANTITY_TYPE_MAP)) {
    if (norm.includes(key) && key.length > bestLen) {
      best = type
      bestLen = key.length
    }
  }
  return best ?? 'unit'
}

export function formatQuantity(product) {
  if (product?.quantity == null) return null
  if (product.quantityType === 'weight') {
    const grams = product.quantityUnit === 'kg'
      ? product.quantity * 1000
      : product.quantity
    if (grams >= 1000) return `${parseFloat((grams / 1000).toFixed(2))} kg`
    return `${grams} g`
  }
  const n = product.quantity
  return `${n} ${n === 1 ? 'unidad' : 'unidades'}`
}

// Mapa exhaustivo de palabras clave → emoji (claves ya normalizadas)
export const EMOJI_MAP = {
  // Carnes y aves
  pollo: '🥩', pechuga: '🥩', muslo: '🥩', pavo: '🥩', carne: '🥩',
  vacuno: '🥩', filete: '🥩', lomo: '🥩', costilla: '🥩', asado: '🥩',
  cerdo: '🥩', cordero: '🥩', plateada: '🥩', mechada: '🥩', molida: '🥩',
  chancho: '🥩', jamon: '🥩', salame: '🥩', longaniza: '🥩', chorizo: '🥩',
  salchicha: '🥩', mortadela: '🥩', vienesa: '🥩', nugget: '🥩',
  tocino: '🥓', panceta: '🥓',
  // Pescados y mariscos
  salmon: '🐟', merluza: '🐟', atun: '🐟', reineta: '🐟', corvina: '🐟',
  trucha: '🐟', pescado: '🐟', sardina: '🐟', anchoa: '🐟', anchovi: '🐟',
  camaron: '🦐', langostino: '🦐',
  jaiva: '🦀', centolla: '🦀', cangrejo: '🦀',
  almeja: '🦪', ostra: '🦪', ostion: '🦪', mejillon: '🦪',
  pulpo: '🦑', calamar: '🦑', jibia: '🦑',
  // Lácteos
  leche: '🥛', yogur: '🥛', yoghurt: '🥛', kefir: '🥛', crema: '🥛',
  queso: '🧀', quesillo: '🧀', ricotta: '🧀', camembert: '🧀',
  brie: '🧀', gouda: '🧀', parmesano: '🧀', mozzarella: '🧀',
  mantequilla: '🧈', margarina: '🧈',
  // Huevos
  huevo: '🥚',
  // Verduras de hoja y hierbas
  lechuga: '🥬', espinaca: '🥬', acelga: '🥬', kale: '🥬', repollo: '🥬',
  rucula: '🥬', endivia: '🥬', apio: '🥬', alcachofa: '🥬',
  cilantro: '🌿', perejil: '🌿', albahaca: '🌿', oregano: '🌿',
  menta: '🌿', romero: '🌿', tomillo: '🌿', ciboulette: '🌿',
  // Verduras
  tomate: '🍅',
  pepino: '🥒', zucchini: '🥒', zapallito: '🥒',
  zanahoria: '🥕',
  brocoli: '🥦', coliflor: '🥦', esparrago: '🥦',
  choclo: '🌽', maiz: '🌽',
  pimenton: '🫑', pimienta: '🧂',
  cebolla: '🧅', puerro: '🧅', chalota: '🧅',
  ajo: '🧄',
  palta: '🥑', aguacate: '🥑',
  berenjena: '🍆',
  zapallo: '🎃', calabaza: '🎃',
  betarraga: '🫛', remolacha: '🫛', poroto: '🫛',
  papa: '🥔', patata: '🥔',
  // Frutas
  manzana: '🍎', granada: '🍎',
  pera: '🍐',
  platano: '🍌', banana: '🍌',
  naranja: '🍊', mandarina: '🍊', clementina: '🍊',
  limon: '🍋', lima: '🍋',
  durazno: '🍑', nectarin: '🍑', ciruela: '🍑',
  cereza: '🍒',
  frutilla: '🍓', fresa: '🍓', frambuesa: '🍓',
  arandano: '🫐', mora: '🫐',
  sandia: '🍉',
  melon: '🍈', higo: '🍈', papaya: '🍈', maracuya: '🍈',
  pina: '🍍', ananas: '🍍',
  mango: '🥭',
  kiwi: '🥝',
  uva: '🍇',
  // Panadería
  marraqueta: '🍞', hallulla: '🍞', molde: '🍞', integral: '🍞', centeno: '🍞',
  baguette: '🥖', ciabatta: '🥖', focaccia: '🥖',
  tortilla: '🫓', arepa: '🫓', pita: '🫓',
  croissant: '🥐',
  muffin: '🧁', queque: '🧁', cupcake: '🧁',
  pan: '🍞',
  // Pastas y granos
  arroz: '🌾', quinoa: '🌾', avena: '🌾', harina: '🌾', semola: '🌾',
  pasta: '🍝', fideos: '🍝', espagueti: '🍝', spaghetti: '🍝', tagliatelle: '🍝',
  lenteja: '🫘', garbanzo: '🫘', frijol: '🫘', arveja: '🫘', lupino: '🫘',
  // Condimentos y salsas
  sal: '🧂',
  aceite: '🫙', vinagre: '🫙', ketchup: '🫙', mayonesa: '🫙',
  mostaza: '🫙', mermelada: '🫙', salsa: '🫙', soya: '🫙', tahini: '🫙',
  miel: '🍯',
  // Snacks y dulces
  chocolate: '🍫', cacao: '🍫',
  galleta: '🍪', cookie: '🍪',
  cereal: '🌾', granola: '🌾',
  mani: '🥜', cacahuete: '🥜',
  almendra: '🌰', nuez: '🌰', castana: '🌰', pecana: '🌰',
  chips: '🍿', canchita: '🍿',
  caramelo: '🍬', dulce: '🍬',
  // Bebidas
  jugo: '🧃', zumo: '🧃', nectar: '🧃',
  agua: '💧',
  bebida: '🥤', gaseosa: '🥤', refresco: '🥤',
  vino: '🍷',
  cerveza: '🍺',
  cafe: '☕', espresso: '☕',
  te: '🍵', infusion: '🍵', hierba: '🍵',
  // Congelados y preparados
  pizza: '🍕',
  helado: '🍦',
  // Enlatados
  conserva: '🥫', enlatado: '🥫',
}

// Categorías para el grid de selección de ícono en AddPanel
export const EMOJI_CATEGORIES = [
  { label: 'Carnes',             emojis: ['🥩', '🍗', '🥓', '🌭'] },
  { label: 'Pescados y mariscos', emojis: ['🐟', '🦐', '🦑', '🦀', '🦪', '🐠'] },
  { label: 'Lácteos y huevos',   emojis: ['🥛', '🧀', '🥚', '🧈'] },
  { label: 'Verduras',           emojis: ['🥬', '🍅', '🥒', '🥕', '🥦', '🌽', '🫑', '🧅', '🧄', '🥑', '🍆', '🎃', '🫛', '🥔', '🌿'] },
  { label: 'Frutas',             emojis: ['🍎', '🍐', '🍌', '🍊', '🍋', '🍑', '🍒', '🍓', '🫐', '🍉', '🍈', '🍍', '🥭', '🥝', '🍇'] },
  { label: 'Pan y cereales',     emojis: ['🍞', '🥖', '🥐', '🫓', '🧁', '🌾', '🍝', '🫘'] },
  { label: 'Condimentos',        emojis: ['🧂', '🫙', '🍯', '🫒', '🥫'] },
  { label: 'Snacks y dulces',    emojis: ['🍫', '🍪', '🍿', '🥜', '🌰', '🍬'] },
  { label: 'Bebidas',            emojis: ['🧃', '💧', '🥤', '🍷', '🍺', '☕', '🍵'] },
  { label: 'Varios',             emojis: ['🍕', '🍦', '🧊', '🛒', '🥡'] },
]

// Devuelve el emoji más apropiado para un nombre de producto, o null si no hay match
export function getEmoji(nombre) {
  if (!nombre?.trim()) return null
  const norm = normalize(nombre)
  if (EMOJI_MAP[norm] !== undefined) return EMOJI_MAP[norm]
  // Substring insensible a tildes — prefiere la clave más larga
  let best = null, bestLen = 0
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (norm.includes(key) && key.length > bestLen) {
      best = emoji
      bestLen = key.length
    }
  }
  return best
}