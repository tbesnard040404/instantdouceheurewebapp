import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/sanitize'

const FORFAIT_LABELS: Record<string, string> = {
  essentiel: 'Forfait Essentiel',
  regulier: 'Forfait Régulier',
  intensif: 'Forfait Intensif',
  grossesse: 'Forfait Grossesse',
  perinatalite: 'Forfait Périnatalité',
  cadeau: 'Carte Cadeau',
}

export default async function ClientPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const cleanToken = sanitizeText(token ?? '')

  if (!cleanToken) notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('nom, type_forfait, seances_restantes, seances_totales, expires_at, actif')
    .eq('qr_token', cleanToken)
    .maybeSingle()

  if (!client) notFound()

  const pct = Math.round((client.seances_restantes / client.seances_totales) * 100)
  const isExpired = client.expires_at && new Date(client.expires_at) < new Date()
  const isExhausted = client.seances_restantes === 0

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>

        <p style={{ margin: '0 0 4px', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7AA394' }}>Instant Douce'Heure</p>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', color: '#1A2820' }}>Bonjour, {client.nom}</h1>

        <div style={{ background: '#EBF2EF', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5A6E68' }}>Votre forfait</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#3D6255' }}>{FORFAIT_LABELS[client.type_forfait] ?? client.type_forfait}</p>
        </div>

        {(isExpired || isExhausted || !client.actif) ? (
          <div style={{ background: '#FEE2E2', borderRadius: 10, padding: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#DC2626', fontWeight: 700 }}>
              {!client.actif ? 'Forfait désactivé' : isExpired ? 'Carte expirée' : 'Forfait épuisé'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#5A6E68' }}>Séances restantes</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#3D6255' }}>{client.seances_restantes} / {client.seances_totales}</span>
              </div>
              <div style={{ background: '#E6E2D9', borderRadius: 100, height: 8 }}>
                <div style={{ background: '#3D6255', borderRadius: 100, height: 8, width: `${pct}%`, transition: 'width .4s' }} />
              </div>
            </div>

            {client.expires_at && (
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#B8966A', textAlign: 'center' }}>
                ⏳ Valable jusqu'au {new Date(client.expires_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </>
        )}

        <p style={{ margin: '24px 0 0', fontSize: 12, color: '#8AA098', textAlign: 'center' }}>
          Contact : <a href="mailto:contact@instantdouceheure.com" style={{ color: '#3D6255' }}>contact@instantdouceheure.com</a>
        </p>
      </div>
    </main>
  )
}
