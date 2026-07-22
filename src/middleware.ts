import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_MAP = new Map<string, { hits: number; resetAt: number }>()
const RATE_RULES: { pattern: RegExp; max: number }[] = [
  { pattern: /^\/admin\/login/, max: 10 },
  { pattern: /^\/api\/admin\/login/, max: 10 },
  { pattern: /^\/api\/stripe\//, max: 30 },
  { pattern: /^\/api\//, max: 60 },
]

function checkRateLimit(ip: string, pathname: string): boolean {
  const rule = RATE_RULES.find(r => r.pattern.test(pathname))
  if (!rule) return true
  const now = Date.now()
  const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`
  const entry = RATE_MAP.get(key)
  if (!entry || now > entry.resetAt) {
    RATE_MAP.set(key, { hits: 1, resetAt: now + 60_000 })
    return true
  }
  entry.hits++
  return entry.hits <= rule.max
}

async function hashPassword(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + secret)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip, pathname)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
    })
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const token = request.cookies.get('admin_token')?.value
    const expected = await hashPassword(
      process.env.ADMIN_PASSWORD ?? '',
      process.env.ADMIN_TOKEN_SECRET ?? ''
    )
    if (token !== expected) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
