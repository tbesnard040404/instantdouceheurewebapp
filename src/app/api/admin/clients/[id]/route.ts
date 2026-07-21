import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}

  if (typeof body.seances_restantes === 'number') {
    if (body.seances_restantes < 0) {
      return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 })
    }
    updates.seances_restantes = body.seances_restantes
  }

  if (typeof body.seances_totales === 'number') {
    if (body.seances_totales < 1) {
      return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 })
    }
    updates.seances_totales = body.seances_totales
  }

  if (typeof body.actif === 'boolean') {
    updates.actif = body.actif
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select('id, nom, seances_restantes, seances_totales, actif')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
