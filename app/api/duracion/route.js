import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { name } = await req.json()
    if (!name || name.trim().length < 2) return Response.json({ days: 7 })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `¿Cuántos días dura en óptimas condiciones un producto alimenticio llamado "${name.trim()}"? Considera condiciones chilenas normales (refrigerador a 4°C para perecibles, despensa para secos). Responde SOLO con un número entero, sin texto adicional.`
      }]
    })

    const raw = message.content[0].text.trim()
    const days = parseInt(raw)
    if (isNaN(days) || days < 1 || days > 1825) return Response.json({ days: 7 })
    return Response.json({ days })
  } catch {
    return Response.json({ days: 7 })
  }
}
