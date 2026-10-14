import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await supabase.from('clients').select('id').limit(1)
  if (error) {
    console.error('[ping] Supabase query failed:', error.message)
    return NextResponse.json({ ok: false, db: 'error' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, db: 'ok' })
}
