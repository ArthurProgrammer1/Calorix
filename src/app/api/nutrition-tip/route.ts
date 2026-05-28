import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const fallbacks = [
  '💡 Eating protein with every meal keeps you fuller longer and protects muscle mass while in a calorie deficit.',
  '🌊 Drinking 500ml of water before meals can naturally reduce calorie intake by helping you feel satisfied sooner.',
  '🥗 Leafy greens like spinach and kale are almost zero calories but loaded with nutrients — add them to everything.',
  '⏰ Eating your largest meal earlier in the day aligns with your circadian rhythm and improves how your body uses energy.',
  '🍳 Eggs are one of the most satiating foods per calorie — a 3-egg breakfast can keep hunger away for hours.',
  '🏃 Even a 10-minute walk after meals improves insulin sensitivity and helps your body process carbohydrates more efficiently.',
]

export async function POST(request: NextRequest) {
  const { goal, calorieTarget, proteinTarget } = await request.json()
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return Response.json({ tip: fallbacks[Math.floor(Math.random() * fallbacks.length)] })

  try {
    const groq = new Groq({ apiKey })
    const goalText = goal === 'lose' ? 'lose body fat' : goal === 'gain' ? 'build muscle and gain weight' : 'maintain their current weight'
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a top sports nutritionist. Give ONE specific, evidence-based nutrition tip for someone trying to ${goalText}. Their daily target is ${calorieTarget} calories and ${proteinTarget}g protein.\n\nRules:\n- Maximum 2 sentences\n- Be specific and actionable, not generic\n- Start with a relevant emoji\n- Sound like advice from a knowledgeable friend, not a textbook\n- Vary topics: food timing, specific foods, meal composition, habits, hydration, macros`,
      }],
      max_tokens: 100,
      temperature: 0.9,
    })
    const tip = result.choices[0]?.message?.content?.trim()
    return Response.json({ tip: tip || fallbacks[0] })
  } catch {
    return Response.json({ tip: fallbacks[Math.floor(Math.random() * fallbacks.length)] })
  }
}
