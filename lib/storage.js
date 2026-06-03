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

// Normaliza texto: minúsculas y sin tildes para matching insensible
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Duraciones en días — claves ya normalizadas (sin tildes, minúsculas)
// Matching por especificidad: gana la clave más larga que haga match
export const DURATION_MAP = {
  // Verduras
  tomate: 5, lechuga: 4, espinaca: 4, zanahoria: 14, brocoli: 5,
  cebolla: 30, ajo: 30, palta: 4, pepino: 7, pimenton: 7,
  choclo: 3, 'poroto verde': 5, acelga: 5, betarraga: 14,
  cilantro: 7, perejil: 7, papa: 14, papas: 14, alcachofa: 5,
  // Frutas
  manzana: 21, pera: 7, platano: 4, naranja: 14,
  limon: 21, durazno: 4, frutilla: 3, nectarin: 4, ciruela: 4,
  kiwi: 14, uva: 7, sandia: 7, melon: 5,
  papaya: 4, frambuesa: 3, arandano: 7, mandarina: 14,
  pina: 5, mango: 4,
  // Carnes frescas
  pollo: 2, 'carne vacuno': 3, cerdo: 3, pavo: 2, cordero: 3,
  pechuga: 2, filete: 3, lomo: 3, costilla: 3,
  // Embutidos y carnes procesadas
  vienesa: 7, hamburguesa: 2, longaniza: 5, chorizo: 5, jamon: 7, mortadela: 5,
  salame: 7, tocino: 7, filetito: 90, filetitos: 90,
  // Pescados y mariscos
  salmon: 2, merluza: 2, 'atun fresco': 2, camarones: 2,
  trucha: 2, corvina: 2, reineta: 2, sardina: 2,
  // Lácteos
  leche: 7, yogur: 10, yogurt: 10, yoghurt: 10,
  'queso fresco': 7, 'queso mantecoso': 14, quesillo: 5,
  mantequilla: 30, crema: 7, ricotta: 5,
  // Huevos
  huevos: 21, huevo: 21,
  // Pan y panadería
  'pan de molde': 5, marraqueta: 1, hallulla: 1, baguette: 2,
  molde: 5, pan: 3,
  galleta: 180, alteza: 180, triton: 180,
  // Pastas y granos (despensa)
  'pasta seca': 730, espagueti: 730, tallarin: 730, quifaro: 730,
  canuto: 730, fideo: 730, pasta: 730, arroz: 730,
  harina: 365, avena: 365, quinoa: 365, semola: 365,
  lenteja: 730, garbanzo: 730, poroto: 730,
  // Conservas y salsas (valores para producto abierto)
  'conservas cerradas': 730, 'conservas abiertas': 3, conserva: 3,
  'salsa de tomate': 5, 'salsa tomate': 5,
  ketchup: 30, mayonesa: 30, mostaza: 30, atun: 3,
  // Aderezos y condimentos (despensa)
  'aceite de oliva': 365, aceite: 365, vinagre: 730,
  laurel: 365, oregano: 365, 'ajo molido': 365, canela: 365,
  comino: 365, merken: 365, sal: 1825, pimienta: 730,
  // Bebidas calientes (despensa)
  manzanilla: 365, te: 365, cafe: 365, nescafe: 365,
  // Congelados
  nugget: 90, helado: 90, 'pizza congelada': 90,
  // Snacks
  chocolate: 180, mani: 180, almendra: 180,
}

// Devuelve días para el nombre dado, o undefined si no hay match
export function getDuration(name) {
  if (!name?.trim()) return undefined
  const norm = normalize(name)
  if (DURATION_MAP[norm] !== undefined) return DURATION_MAP[norm]
  let best = undefined, bestLen = 0
  for (const [key, days] of Object.entries(DURATION_MAP)) {
    if (norm.includes(key) && key.length > bestLen) {
      best = days
      bestLen = key.length
    }
  }
  return best
}

// Backward compat: devuelve null en lugar de undefined
export function lookupDuracion(nombre) {
  return getDuration(nombre) ?? null
}

// Claves normalizadas de frutas y verduras frescas (muestran selector de madurez)
const FRUTAS_VERDURAS_KEYS = [
  'tomate', 'lechuga', 'espinaca', 'zanahoria', 'brocoli',
  'cebolla', 'palta', 'pepino', 'pimenton',
  'choclo', 'poroto verde', 'acelga', 'betarraga',
  'cilantro', 'perejil', 'papa',
  'manzana', 'pera', 'platano', 'naranja',
  'limon', 'durazno', 'frutilla', 'nectarin', 'ciruela',
  'kiwi', 'uva', 'sandia', 'melon',
  'papaya', 'frambuesa', 'arandano', 'mandarina',
  'pina', 'mango',
]

export function esFrutaVerdura(nombre) {
  if (!nombre?.trim()) return false
  const norm = normalize(nombre)
  return FRUTAS_VERDURAS_KEYS.some(k => norm.includes(k))
}

// Mapa de palabras clave → tipo de medida (claves ya normalizadas)
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

// Mapa exhaustivo de palabras clave → emoji (claves ya normalizadas, sin tildes)
export const EMOJI_MAP = {
  // Carnes y aves
  pollo: '🥩', pechuga: '🥩', muslo: '🥩', pavo: '🥩', carne: '🥩',
  vacuno: '🥩', filete: '🥩', lomo: '🥩', costilla: '🥩', asado: '🥩',
  cerdo: '🥩', cordero: '🥩', plateada: '🥩', mechada: '🥩', molida: '🥩',
  chancho: '🥩', jamon: '🥩', salame: '🥩',
  // Embutidos procesados
  longaniza: '🌭', chorizo: '🌭', salchicha: '🌭', vienesa: '🌭', 'hot dog': '🌭',
  mortadela: '🥩', hamburguesa: '🍔',
  nugget: '🍗', filetito: '🍗', filetitos: '🍗',
  tocino: '🥓', panceta: '🥓',
  // Pescados y mariscos
  salmon: '🐟', merluza: '🐟', atun: '🐟', reineta: '🐟', corvina: '🐟',
  trucha: '🐟', pescado: '🐟', sardina: '🐟', anchoa: '🐟', anchovi: '🐟',
  camaron: '🦐', langostino: '🦐',
  jaiva: '🦀', centolla: '🦀', cangrejo: '🦀',
  almeja: '🦪', ostra: '🦪', ostion: '🦪', mejillon: '🦪',
  pulpo: '🦑', calamar: '🦑', jibia: '🦑',
  // Lácteos
  leche: '🥛', yogur: '🥛', yogurt: '🥛', yoghurt: '🥛', kefir: '🥛', crema: '🥛',
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
  marraqueta: '🥖', hallulla: '🥖', baguette: '🥖', ciabatta: '🥖', focaccia: '🥖',
  molde: '🍞', integral: '🍞', centeno: '🍞', lactal: '🍞',
  tortilla: '🫓', arepa: '🫓', pita: '🫓',
  croissant: '🥐',
  muffin: '🧁', queque: '🧁', cupcake: '🧁',
  pan: '🍞',
  alteza: '🍪', triton: '🍪', galleta: '🍪', cookie: '🍪',
  // Pastas y granos
  tallarin: '🍝', quifaro: '🍝', canuto: '🍝', fideo: '🍝',
  pasta: '🍝', fideos: '🍝', espagueti: '🍝', spaghetti: '🍝', tagliatelle: '🍝',
  arroz: '🍚', quinoa: '🌾', avena: '🌾', harina: '🌾', semola: '🌾',
  lenteja: '🫘', garbanzo: '🫘', frijol: '🫘', arveja: '🫘', lupino: '🫘',
  // Condimentos, salsas y aceites
  'aceite de oliva': '🫒', oliva: '🫒',
  aceite: '🫙', vinagre: '🫙', ketchup: '🫙', mayonesa: '🫙',
  mostaza: '🫙', mermelada: '🫙', salsa: '🫙', soya: '🫙', tahini: '🫙',
  sal: '🧂',
  miel: '🍯',
  // Snacks y dulces
  chocolate: '🍫', cacao: '🍫',
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
  nescafe: '☕', cafe: '☕', espresso: '☕',
  te: '🍵', infusion: '🍵', hierba: '🍵', manzanilla: '🍵',
  // Congelados y preparados
  pizza: '🍕',
  helado: '🍦',
  // Enlatados
  conserva: '🥫', enlatado: '🥫',
}

// Categorías para el grid de selección de ícono en AddPanel
export const EMOJI_CATEGORIES = [
  { label: 'Carnes',             emojis: ['🥩', '🍗', '🥓', '🌭', '🍔'] },
  { label: 'Pescados y mariscos', emojis: ['🐟', '🦐', '🦑', '🦀', '🦪', '🐠'] },
  { label: 'Lácteos y huevos',   emojis: ['🥛', '🧀', '🥚', '🧈'] },
  { label: 'Verduras',           emojis: ['🥬', '🍅', '🥒', '🥕', '🥦', '🌽', '🫑', '🧅', '🧄', '🥑', '🍆', '🎃', '🫛', '🥔', '🌿'] },
  { label: 'Frutas',             emojis: ['🍎', '🍐', '🍌', '🍊', '🍋', '🍑', '🍒', '🍓', '🫐', '🍉', '🍈', '🍍', '🥭', '🥝', '🍇'] },
  { label: 'Pan y cereales',     emojis: ['🍞', '🥖', '🥐', '🫓', '🧁', '🍚', '🍝', '🫘', '🌾'] },
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
