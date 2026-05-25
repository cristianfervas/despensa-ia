import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { products } = await req.json()

    function fmtQty(p) {
      if (p.quantity == null) return ''
      if (p.quantityType === 'weight') {
        const g = p.quantityUnit === 'kg' ? p.quantity * 1000 : p.quantity
        return g >= 1000 ? ` — ${parseFloat((g / 1000).toFixed(2))} kg` : ` — ${g} g`
      }
      return ` — ${p.quantity} ${p.quantity === 1 ? 'unidad' : 'unidades'}`
    }

    const inventario = products.length === 0
      ? 'La despensa está completamente vacía.'
      : products.map(p => {
          const dl = Math.round((new Date(p.expiry) - new Date()) / 86400000)
          const vence = dl < 0 ? `venció hace ${Math.abs(dl)} día(s)` : dl === 0 ? 'vence hoy' : `vence en ${dl} día(s)`
          return `- ${p.emoji} ${p.name}${fmtQty(p)} — ${vence} (${p.status})`
        }).join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un asistente de despensa para una familia chilena. Analiza el inventario y genera una lista de compras inteligente.

INVENTARIO ACTUAL:
${inventario}

INSTRUCCIONES:
1. Productos con status "urgent" o "warn": inclúyelos para reponer con priority "urgent" o "warn" respectivamente.
2. Si un producto tiene cantidad baja (menos de 2 unidades o menos de 200 g), sugerirlo para reponer aunque no esté próximo a vencer. Usa priority "warn" en esos casos.
3. Compara con una despensa básica chilena y sugiere lo que falta: proteínas (pollo, carne vacuno, huevos), lácteos (leche, yogur, queso), verduras (lechuga, tomate, palta, cebolla), frutas (manzana, plátano), básicos (arroz, pasta, aceite, pan). Estos van con priority "ok".
4. Sugiere cantidades concretas: "1 kg", "1 litro", "6 unidades", "1 unidad", etc.
5. El campo "reason" debe ser corto y concreto, máximo 30 caracteres.

Responde SOLO con JSON válido, sin texto adicional:
{
  "items": [
    {
      "name": "Nombre corto en español",
      "emoji": "emoji apropiado",
      "reason": "Motivo breve",
      "priority": "urgent",
      "quantity": "1 kg"
    }
  ]
}

Máximo 12 ítems. Orden: urgent primero, luego warn, luego ok.`,
      }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const { items } = JSON.parse(clean)

    return Response.json({ items })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al generar la lista de compras' }, { status: 500 })
  }
}
