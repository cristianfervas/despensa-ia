import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EMOJI_MAP = {
  pollo: '🥩', carne: '🥩', vacuno: '🥩', cerdo: '🥩', pavo: '🥩', cordero: '🥩',
  leche: '🥛', yogur: '🥛', yoghurt: '🥛',
  huevo: '🥚', huevos: '🥚',
  lechuga: '🥬', espinaca: '🥬', acelga: '🥬', repollo: '🥬', kale: '🥬',
  manzana: '🍎', manzanas: '🍎', pera: '🍐', naranja: '🍊', limón: '🍋', limon: '🍋',
  queso: '🧀',
  salmón: '🐟', salmon: '🐟', pescado: '🐟', atún: '🐟', atun: '🐟', merluza: '🐟',
  pan: '🍞', marraqueta: '🍞', hallulla: '🍞',
  tomate: '🍅', tomates: '🍅',
  zanahoria: '🥕', zanahorias: '🥕',
  cebolla: '🧅', cebollas: '🧅',
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
  return 7
}

export async function POST(req) {
  try {
    const { image, mimeType } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: image },
          },
          {
            type: 'text',
            text: `Esta es una boleta de supermercado chileno. Extrae solo los productos alimenticios (ignora bolsas, descuentos, totales, impuestos).
Responde SOLO con JSON válido, sin texto adicional:
{
  "items": ["nombre producto 1", "nombre producto 2", ...]
}
Usa nombres cortos y en español. Máximo 15 productos.`,
          },
        ],
      }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const { items } = JSON.parse(clean)

    const today = new Date().toISOString().split('T')[0]
    const products = items.map(name => ({
      emoji: getEmoji(name),
      name,
      date: today,
      days: getDays(name),
    }))

    return Response.json({ products })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al leer la boleta' }, { status: 500 })
  }
}