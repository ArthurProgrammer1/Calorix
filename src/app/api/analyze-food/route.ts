import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const PROMPT = `You are a nutrition expert. Analyze this food image and identify every visible food item.

For each item return exact nutritional estimates based on the visible portion size.

Respond with ONLY a valid JSON array — no markdown, no code fences, no explanation:
[{"name":"food name","portion":"estimated serving","calories":0,"protein":0,"carbs":0,"fat":0}]

Rules:
- Be specific (e.g. "Grilled chicken breast 200g" not just "chicken")
- Estimate realistic portions from what you can see
- All numeric values must be integers
- If no food is visible at all, return []
- Include every separate item you can identify (e.g. side dishes, drinks, sauces)`

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY not set in .env.local' }, { status: 500 })
  }

  try {
    const { imageBase64, mimeType, note } = await request.json()
    if (!imageBase64) return Response.json({ error: 'No image provided' }, { status: 400 })

    const groq = new Groq({ apiKey })

    const promptText = note?.trim()
      ? `${PROMPT}\n\nIMPORTANT — User note about this meal: "${note.trim()}"\nAdjust your nutritional estimates based on this note (e.g. ingredient substitutions, cooking method, portion changes).`
      : PROMPT

    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1024,
    })

    const text = result.choices[0]?.message?.content?.trim() ?? ''

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return Response.json([])

    const foods = JSON.parse(match[0])
    const clean = (foods as Record<string, unknown>[]).map(f => ({
      name: String(f.name ?? ''),
      portion: String(f.portion ?? ''),
      calories: Math.round(Number(f.calories) || 0),
      protein: Math.round(Number(f.protein) || 0),
      carbs: Math.round(Number(f.carbs) || 0),
      fat: Math.round(Number(f.fat) || 0),
    })).filter(f => f.name && f.calories > 0)

    return Response.json(clean)
  } catch (err) {
    console.error('Groq error:', err)
    return Response.json({ error: 'Analysis failed — check your API key' }, { status: 500 })
  }
}
