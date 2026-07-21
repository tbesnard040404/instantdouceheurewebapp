import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/sanitize'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const token = sanitizeText(req.nextUrl.searchParams.get('token') ?? '')

  if (!UUID_REGEX.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .select('nom, type_forfait, seances_restantes, seances_totales, expires_at, actif')
    .eq('qr_token', token)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
