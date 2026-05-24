const EMOJI_MAP = {
  pollo: '🥩', carne: '🥩', vacuno: '🥩', cerdo: '🥩', pavo: '🥩',
  leche: '🥛', yogur: '🥛', yoghurt: '🥛',
  huevo: '🥚', huevos: '🥚',
  lechuga: '🥬', espinaca: '🥬', acelga: '🥬',
  manzana: '🍎', pera: '🍐', naranja: '🍊', limón: '🍋', limon: '🍋',
  queso: '🧀',
  salmón: '🐟', salmon: '🐟', pescado: '🐟', atún: '🐟', atun: '🐟', merluza: '🐟',
  pan: '🍞', marraqueta: '🍞',
  tomate: '🍅',
  zanahoria: '🥕',
  cebolla: '🧅',
  ajo: '🧄',
  brócoli: '🥦', brocoli: '🥦',
  default: '🫙',
}

function getEmoji(name) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji
  }
  return EMOJI_MAP.default
}

function getDays(name) {
  const lower = name.toLowerCase()
  if (/pollo|carne|vacuno|cerdo|pavo|salmón|salmon|pescado|merluza/.test(lower)) return 3
  if (/leche|yogur/.test(lower)) return 7
  if (/lechuga|espinaca|acelga|tomate/.test(lower)) return 5
  if (/queso|embutido|jamón/.test(lower)) return 7
  if (/huevo/.test(lower)) return 14
  if (/manzana|pera|naranja|limón|zanahoria|brócoli/.test(lower)) return 14
  if (/pan/.test(lower)) return 3
  return 90
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) return Response.json({ error: 'Código requerido' }, { status: 400 })

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
      { headers: { 'User-Agent': 'DespensaIA/1.0' } }
    )
    const data = await res.json()

    if (data.status !== 1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const p = data.product
    const name =
      p.product_name_es ||
      p.product_name ||
      p.product_name_en ||
      'Producto sin nombre'

    return Response.json({
      name,
      emoji: getEmoji(name),
      days: getDays(name),
    })
  } catch {
    return Response.json({ error: 'Error al consultar la base de datos' }, { status: 500 })
  }
}
