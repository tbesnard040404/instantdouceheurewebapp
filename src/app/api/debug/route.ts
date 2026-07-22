import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const url = process.env.SUPABASE_URL ?? 'MISSING'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const keyFormat = key.startsWith('eyJ') ? 'legacy-jwt'
    : key.startsWith('sb_') ? 'new-sb-format'
    : key ? 'unknown-format'
    : 'MISSING'

  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .limit(1)

  return NextResponse.json({
    supabase_url: url,
    key_format: keyFormat,
    key_present: !!key,
    supabase_error: error?.message ?? null,
    supabase_ok: !error,
    row_count: data?.length ?? 0,
  })
}
