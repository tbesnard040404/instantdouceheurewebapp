import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { sanitizeText } from '@/lib/sanitize'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let token: unknown
  try {
    ({ token } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const cleanToken = sanitizeText(token)

  if (!UUID_REGEX.test(cleanToken)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('id, seances_restantes, actif, expires_at')
    .eq('qr_token', cleanToken)
    .maybeSingle()

  if (fetchError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  if (!client.actif) {
    return NextResponse.json({ error: 'Forfait inactif' }, { status: 403 })
  }

  if (client.expires_at && new Date(client.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Carte expirée' }, { status: 403 })
  }

  if (client.seances_restantes <= 0) {
    return NextResponse.json({ error: 'Plus de séances disponibles' }, { status: 400 })
  }

  const { data: updateResult, error: updateError } = await supabase
    .from('clients')
    .update({ seances_restantes: client.seances_restantes - 1 })
    .eq('id', client.id)
    .eq('seances_restantes', client.seances_restantes)
    .select('seances_restantes')

  if (updateError || !updateResult || updateResult.length === 0) {
    return NextResponse.json({ error: 'Conflit, réessayez' }, { status: 409 })
  }

  const { error: logError } = await supabase.from('seances_log').insert({ client_id: client.id })
  if (logError) {
    console.error('seances_log insert failed for client', client.id, logError.message)
  }

  return NextResponse.json({ seances_restantes: updateResult[0].seances_restantes })
}
