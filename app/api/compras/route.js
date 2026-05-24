import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { products } = await req.json()

    const inventario = products.length === 0
      ? 'La despensa está completamente vacía.'
      : products.map(p =>
          `- ${p.emoji} ${p.name}: status "${p.status}", vence ${p.expiry}`
        ).join('\n')

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
2. Compara con una despensa básica chilena y sugiere lo que falta: proteínas (pollo, carne vacuno, huevos), lácteos (leche, yogur, queso), verduras (lechuga, tomate, palta, cebolla), frutas (manzana, plátano), básicos (arroz, pasta, aceite, pan). Estos van con priority "ok".
3. Sugiere cantidades concretas: "1 kg", "1 litro", "6 unidades", "1 unidad", etc.
4. El campo "reason" debe ser corto y concreto, máximo 30 caracteres.

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
