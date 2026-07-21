'use client'
import { useEffect, useRef, useState } from 'react'

interface ClientData {
  nom: string
  type_forfait: string
  seances_restantes: number
  seances_totales: number
  actif: boolean
}

const LABELS: Record<string, string> = {
  essentiel: 'Forfait Essentiel',
  regulier: 'Forfait Régulier',
  intensif: 'Forfait Intensif',
  grossesse: 'Forfait Grossesse',
  perinatalite: 'Forfait Périnatalité',
  cadeau: 'Carte Cadeau',
}

export default function ScanPage() {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [client, setClient] = useState<ClientData | null>(null)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'confirm' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null
    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      scanner = new Html5Qrcode('qr-reader')
      setScanning(true)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          const url = new URL(decodedText)
          const t = url.searchParams.get('token') ?? ''
          if (!t) return
          await scanner.stop()
          setScanning(false)
          await fetchClient(t)
        },
        () => {}
      )
    }
    startScanner()
    return () => {
      if (scanner) {
        scanner.stop().catch(() => {})
      }
    }
  }, [])

  async function fetchClient(t: string) {
    const res = await fetch(`/api/client/info?token=${t}`)
    if (!res.ok) { setStatus('error'); setMessage('QR code invalide'); return }
    const data = await res.json()
    setClient(data)
    setToken(t)
    setStatus('confirm')
  }

  async function validateSession() {
    const res = await fetch('/api/client/decrement', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setMessage(`Séance validée ! Il reste ${data.seances_restantes} séance(s).`)
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Erreur')
    }
  }

  function reset() {
    setClient(null)
    setToken('')
    setStatus('idle')
    setMessage('')
    window.location.reload()
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1A2820', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7AA394' }}>Admin</p>
      <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', color: '#E4EDE8' }}>Scanner un forfait</h1>

      {status === 'idle' && (
        <div>
          <div id="qr-reader" ref={scannerRef} style={{ width: '100%', maxWidth: 360, borderRadius: 12, overflow: 'hidden', border: '2px solid #3D6255' }} />
          {scanning && <p style={{ color: '#7AA394', fontSize: 13, marginTop: 12 }}>Pointez la caméra vers le QR code du client...</p>}
        </div>
      )}

      {status === 'confirm' && client && (
        <div style={{ background: '#243029', borderRadius: 12, padding: '24px', maxWidth: 360 }}>
          <p style={{ margin: '0 0 16px', color: '#7AA394', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Client identifié</p>
          <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#E4EDE8' }}>{client.nom}</p>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#7AA394' }}>{LABELS[client.type_forfait] ?? client.type_forfait}</p>

          {client.seances_restantes === 0 ? (
            <div style={{ background: '#3B1C1C', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: 0, color: '#F87171', fontWeight: 700 }}>⚠️ Forfait épuisé — aucune séance restante</p>
            </div>
          ) : (
            <div style={{ background: '#1A2820', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#5A6E68' }}>Séances restantes</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#3D6255' }}>{client.seances_restantes} <span style={{ fontSize: 14, color: '#5A6E68', fontWeight: 400 }}>/ {client.seances_totales}</span></p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={reset} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #2C3A33', borderRadius: 8, color: '#7AA394', fontSize: 14, cursor: 'pointer' }}>
              Annuler
            </button>
            <button
              onClick={validateSession}
              disabled={client.seances_restantes === 0}
              style={{ flex: 1, padding: '12px', background: client.seances_restantes === 0 ? '#2C3A33' : '#3D6255', border: 'none', borderRadius: 8, color: client.seances_restantes === 0 ? '#5A6E68' : '#fff', fontSize: 14, fontWeight: 700, cursor: client.seances_restantes === 0 ? 'not-allowed' : 'pointer' }}
            >
              ✓ Valider la séance
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div style={{ background: '#1A3025', border: '1px solid #3D6255', borderRadius: 12, padding: 24, maxWidth: 360 }}>
          <p style={{ margin: '0 0 8px', fontSize: 24 }}>✅</p>
          <p style={{ margin: '0 0 16px', color: '#4CAF78', fontWeight: 700, fontSize: 16 }}>{message}</p>
          <button onClick={reset} style={{ padding: '12px 24px', background: '#3D6255', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Scanner un autre client
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ background: '#3B1C1C', border: '1px solid #DC2626', borderRadius: 12, padding: 24, maxWidth: 360 }}>
          <p style={{ margin: '0 0 16px', color: '#F87171', fontWeight: 700 }}>{message}</p>
          <button onClick={reset} style={{ padding: '12px 24px', background: '#DC2626', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      )}
    </main>
  )
}
