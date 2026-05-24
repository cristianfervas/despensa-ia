import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { products } = await req.json()

    const urgent = products.filter(p => p.status === 'urgent').map(p => p.name)
    const warn   = products.filter(p => p.status === 'warn').map(p => p.name)
    const ok     = products.filter(p => p.status === 'ok').map(p => p.name)

    const prompt = `Eres un chef experto. Tengo estos ingredientes en mi despensa:

URGENTE (usar hoy o mañana): ${urgent.join(', ') || 'ninguno'}
PRONTO (usar en 2-4 días): ${warn.join(', ') || 'ninguno'}
DISPONIBLE: ${ok.join(', ') || 'ninguno'}

Sugiere 4 recetas priorizando los ingredientes URGENTES y PRONTO.
Responde SOLO con un JSON válido, sin texto adicional, con esta estructura exacta:
{
  "recipes": [
    {
      "name": "nombre de la receta",
      "time": "X min",
      "description": "descripción breve de 1-2 oraciones",
      "urgentIngredients": ["ingrediente1", "ingrediente2"],
      "steps": ["paso 1", "paso 2", "paso 3", "paso 4"]
    }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return Response.json(data)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al generar recetas' }, { status: 500 })
  }
}