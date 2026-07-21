import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function hashPassword(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + secret)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

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
  matcher: ['/admin/:path*'],
}
