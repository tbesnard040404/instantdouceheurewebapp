import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'

const attempts = new Map<string, { count: number; reset: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const record = attempts.get(ip)

  if (record && now < record.reset) {
    if (record.count >= 10) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 })
    }
    record.count++
  } else {
    attempts.set(ip, { count: 1, reset: now + 60_000 })
  }

  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = hashPassword(process.env.ADMIN_PASSWORD!)
  const response = NextResponse.json({ ok: true })

  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
