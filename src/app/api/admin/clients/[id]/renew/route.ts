import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('id, seances_totales')
    .eq('id', id)
    .single()

  if (fetchError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
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
