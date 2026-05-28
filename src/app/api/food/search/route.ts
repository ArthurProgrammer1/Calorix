import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const PROMPT = (q: string) => `You are a nutrition database. The user searched for: "${q}"

Return the top 5 most relevant food matches as a JSON array. Include variations (e.g. raw, cooked, grilled) if useful.

Respond with ONLY a valid JSON array — no markdown, no code fences, no explanation:
[{"name":"food name","serving":"serving size","calories":0,"protein":0,"carbs":0,"fat":0}]

Rules:
- name: specific and descriptive (e.g. "Grilled Chicken Breast" not just "Chicken")
- serving: realistic portion (e.g. "100g", "1 medium (118g)", "1 cup (240ml)")
- calories, protein, carbs, fat: integers, based on the stated serving
- protein/carbs/fat in grams
- If query is a brand product, estimate based on typical values`

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return Response.json([])

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return Response.json([])

  try {
    const groq = new Groq({ apiKey })

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: PROMPT(q) }],
      max_tokens: 512,
      temperature: 0.1,
    })

    const text = result.choices[0]?.message?.content?.trim() ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return Response.json([])

    const foods = JSON.parse(match[0]) as Record<string, unknown>[]
    const clean = foods.map(f => ({
      name: String(f.name ?? ''),
      serving: String(f.serving ?? ''),
      calories: Math.round(Number(f.calories) || 0),
      protein: Math.round(Number(f.protein) || 0),
      carbs: Math.round(Number(f.carbs) || 0),
      fat: Math.round(Number(f.fat) || 0),
    })).filter(f => f.name && f.calories > 0)

    return Response.json(clean)
  } catch (err) {
    console.error('Search error:', err)
    return Response.json([])
  }
}
