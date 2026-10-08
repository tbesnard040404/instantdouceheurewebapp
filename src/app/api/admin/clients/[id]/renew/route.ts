import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('id, seances_totales')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  if (!client.seances_totales || client.seances_totales < 1) {
    return NextResponse.json({ error: 'Nombre de séances totales invalide, corrigez-le avant de renouveler' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update({ seances_restantes: client.seances_totales, actif: true })
    .eq('id', id)
    .select('id, nom, seances_restantes, seances_totales, actif')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
