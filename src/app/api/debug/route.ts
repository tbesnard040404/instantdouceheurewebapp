import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  const supabaseUrl = process.env.SUPABASE_URL ?? 'MISSING'
  const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Test basic Supabase connection
  const { data: allClients, error: listError } = await supabase
    .from('clients')
    .select('qr_token, nom, email')
    .limit(5)

  // Test specific token if provided
  let tokenResult = null
  let tokenError = null
  if (token) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('qr_token', token)
      .maybeSingle()
    tokenResult = data
    tokenError = error?.message ?? null
  }

  return NextResponse.json({
    supabase_url: supabaseUrl,
    has_service_key: hasServiceKey,
    connection_error: listError?.message ?? null,
    clients_in_db: allClients?.map(c => ({ token: c.qr_token?.slice(0, 8) + '...', nom: c.nom, email: c.email })) ?? [],
    token_query: token ? { found: !!tokenResult, error: tokenError, data: tokenResult } : 'no token provided',
  })
}
