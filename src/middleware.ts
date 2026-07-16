import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

    const token = request.cookies.get('admin_token')?.value
    const expected = createHash('sha256')
      .update((process.env.ADMIN_PASSWORD ?? '') + (process.env.ADMIN_TOKEN_SECRET ?? ''))
      .digest('hex')

    if (token !== expected) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
