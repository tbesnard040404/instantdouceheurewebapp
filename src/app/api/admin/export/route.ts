import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('clients')
    .select('nom, email, type_forfait, seances_totales, seances_restantes, actif, expires_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const LABELS: Record<string, string> = {
    essentiel: 'Forfait Essentiel',
    regulier: 'Forfait Régulier',
    intensif: 'Forfait Intensif',
    grossesse: 'Forfait Grossesse',
    perinatalite: 'Forfait Périnatalité',
    cadeau: 'Carte Cadeau',
  }

  const header = 'Nom,Email,Forfait,Séances totales,Séances restantes,Statut,Expiration,Date achat'
  const rows = (data ?? []).map(c => [
    `"${c.nom}"`,
    `"${c.email}"`,
    `"${LABELS[c.type_forfait] ?? c.type_forfait}"`,
    c.seances_totales,
    c.seances_restantes,
    c.actif ? 'Actif' : 'Inactif',
    c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : '',
    new Date(c.created_at).toLocaleDateString('fr-FR'),
  ].join(','))

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
