'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const FORFAIT_LABELS: Record<string, string> = {
  essentiel: 'Forfait Essentiel',
  regulier: 'Forfait Régulier',
  intensif: 'Forfait Intensif',
  grossesse: 'Forfait Grossesse',
  perinatalite: 'Forfait Périnatalité',
  cadeau: 'Carte Cadeau',
}

interface ClientData {
  nom: string
  type_forfait: string
  seances_restantes: number
  seances_totales: number
  expires_at: string | null
  actif: boolean
}

function ClientContent() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [client, setClient] = useState<ClientData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setStatus('notfound'); return }
    fetch(`/api/client/public?token=${encodeURIComponent(token)}`)
      .then(r => {
        if (r.status === 404) { setStatus('notfound'); return null }
        if (!r.ok) { setStatus('error'); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setClient(data); setStatus('ok') }
      })
      .catch(() => setStatus('error'))
  }, [token])

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ color: '#7AA394', fontSize: 14 }}>Chargement...</p>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 32 }}>🔍</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 20, fontFamily: 'Georgia,serif', color: '#1A2820' }}>Forfait introuvable</h1>
        <p style={{ margin: 0, color: '#8AA098', fontSize: 14 }}>Ce QR code ne correspond à aucun forfait actif. Contactez Océane si c'est une erreur.</p>
        <p style={{ margin: '16px 0 0', fontSize: 13 }}>
          <a href="mailto:contact@instantdouceheure.com" style={{ color: '#3D6255' }}>contact@instantdouceheure.com</a>
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 32 }}>⚠️</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 20, fontFamily: 'Georgia,serif', color: '#1A2820' }}>Erreur temporaire</h1>
        <p style={{ margin: 0, color: '#8AA098', fontSize: 14 }}>Impossible de charger votre forfait. Réessayez dans quelques instants.</p>
      </div>
    )
  }

  if (!client) return null

  const pct = client.seances_totales > 0
    ? Math.round((client.seances_restantes / client.seances_totales) * 100)
    : 0
  const isExpired = client.expires_at ? new Date(client.expires_at) < new Date() : false
  const isExhausted = client.seances_restantes === 0
  const isInvalid = !client.actif || isExpired || isExhausted

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7AA394' }}>Instant Douce'Heure</p>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia,serif', color: '#1A2820' }}>Bonjour, {client.nom}</h1>

      <div style={{ background: '#EBF2EF', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5A6E68' }}>Votre forfait</p>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#3D6255' }}>{FORFAIT_LABELS[client.type_forfait] ?? client.type_forfait}</p>
      </div>

      {isInvalid ? (
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
  )
}

export default function ClientPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Suspense fallback={<div style={{ color: '#7AA394' }}>Chargement...</div>}>
        <ClientContent />
      </Suspense>
    </main>
  )
}
