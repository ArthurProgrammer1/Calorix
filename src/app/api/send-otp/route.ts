import { NextRequest } from 'next/server'
import { Resend } from 'resend'

// In-memory OTP store: email → { code, expires }
const otpStore = new Map<string, { code: string; expires: number }>()

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  otpStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }) // 10 min expiry

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Dev fallback: log the code to the server console
    console.log(`[Calorix OTP] Code for ${email}: ${code}`)
    return Response.json({ ok: true, dev: true })
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'Calorix <onboarding@resend.dev>',
      to: email,
      subject: 'Your Calorix reset code',
      html: `
        <div style="font-family:sans-serif;background:#0F0F14;padding:40px;border-radius:16px;max-width:480px;margin:auto">
          <div style="text-align:center;margin-bottom:32px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#22C55E;border-radius:12px;font-size:20px;font-weight:bold;color:#000">C</div>
            <h2 style="color:#fff;margin-top:12px;margin-bottom:4px">Calorix</h2>
          </div>
          <h3 style="color:#fff;margin-bottom:8px">Password Reset Code</h3>
          <p style="color:#9CA3AF;margin-bottom:24px">Use the code below to reset your password. It expires in 10 minutes.</p>
          <div style="background:#1A1A24;border:1px solid #2A2A3A;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#22C55E">${code}</span>
          </div>
          <p style="color:#6B7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Resend error:', err)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { email, code } = await request.json()
  if (!email || !code) return Response.json({ valid: false })
  const entry = otpStore.get(email)
  if (!entry) return Response.json({ valid: false })
  if (Date.now() > entry.expires) { otpStore.delete(email); return Response.json({ valid: false, expired: true }) }
  if (entry.code !== code) return Response.json({ valid: false })
  otpStore.delete(email)
  return Response.json({ valid: true })
}
