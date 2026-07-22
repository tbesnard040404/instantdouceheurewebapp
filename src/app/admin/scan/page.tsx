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

const NAV: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #2C2F3A', background: '#111214', position: 'sticky' as const, top: 0, zIndex: 50 }
const NAV_TITLE: React.CSSProperties = { margin: 0, fontSize: 11, color: '#5A5D75', letterSpacing: '.14em', textTransform: 'uppercase' as const, fontWeight: 600 }

export default function ScanPage() {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [client, setClient] = useState<ClientData | null>(null)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'confirm' | 'success' | 'error' | 'denied'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null
    if (status !== 'scanning') return
    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      scanner = new Html5Qrcode('qr-reader')
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async (decodedText: string) => {
          try {
            const url = new URL(decodedText)
            const t = url.searchParams.get('token') ?? ''
            if (!t) return
            await scanner.stop()
            setStatus('confirm')
            await fetchClient(t)
          } catch { /* invalid URL */ }
        },
        () => {}
      )
    }
    startScanner()
    return () => { if (scanner) scanner.stop().catch(() => {}) }
  }, [status])

  async function requestCamera() {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(t => t.stop())
      setStatus('scanning')
    } catch {
      setStatus('denied')
    }
  }

  async function fetchClient(t: string) {
    const res = await fetch(`/api/client/info?token=${t}`)
    if (!res.ok) { setStatus('error'); setMessage('QR code invalide ou forfait introuvable'); return }
    const data = await res.json()
    setClient(data)
    setToken(t)
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
      setMessage(`Séance validée. Séances restantes : ${data.seances_restantes}`)
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Erreur lors de la validation')
    }
  }

  function reset() {
    setClient(null)
    setToken('')
    setStatus('idle')
    setMessage('')
  }

  const pct = client ? Math.round((client.seances_restantes / client.seances_totales) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#111214', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={NAV}>
        <p style={NAV_TITLE}>Instant Douce'Heure</p>
        <div style={{ display: 'flex', gap: 4 }}>
          <a href="/admin/clients" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#8C8FA8', textDecoration: 'none' }}>Clients</a>
          <a href="/admin/scan" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#0D1F17', background: '#4CAF78', textDecoration: 'none' }}>Scanner</a>
        </div>
      </nav>

      <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600, color: '#E4E6F0', letterSpacing: '-.01em' }}>Scanner un forfait</h1>

        {/* IDLE — demande de permission */}
        {status === 'idle' && (
          <div style={{ background: '#1A1C22', border: '1px solid #2C2F3A', borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1C2E26', border: '1px solid #2D4A3E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#E4E6F0' }}>Accès caméra requis</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5A5D75', lineHeight: 1.5 }}>Cliquez pour autoriser la caméra et scanner le QR code du client.</p>
            <button
              onClick={requestCamera}
              style={{ padding: '12px 28px', background: '#1C2E26', border: '1px solid #2D4A3E', borderRadius: 8, color: '#4CAF78', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Activer la caméra
            </button>
          </div>
        )}

        {/* REQUESTING */}
        {status === 'requesting' && (
          <div style={{ background: '#1A1C22', border: '1px solid #2C2F3A', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#8C8FA8' }}>Autorisation en cours...</p>
          </div>
        )}

        {/* DENIED */}
        {status === 'denied' && (
          <div style={{ background: '#1A1215', border: '1px solid #3A1C22', borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#EF4444' }}>Accès caméra refusé</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5A5D75', lineHeight: 1.5 }}>Autorisez l'accès à la caméra dans les paramètres de votre navigateur, puis réessayez.</p>
            <button onClick={reset} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2C2F3A', borderRadius: 8, color: '#8C8FA8', fontSize: 13, cursor: 'pointer' }}>Réessayer</button>
          </div>
        )}

        {/* SCANNING */}
        {status === 'scanning' && (
          <div>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%', borderRadius: 14, overflow: 'hidden', border: '2px solid #2D4A3E' }} />
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#5A5D75', textAlign: 'center' }}>Pointez la caméra vers le QR code</p>
          </div>
        )}

        {/* CONFIRM */}
        {status === 'confirm' && client && (
          <div style={{ background: '#1A1C22', border: '1px solid #2C2F3A', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5A5D75', fontWeight: 600 }}>Client identifié</p>
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#E4E6F0' }}>{client.nom}</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8C8FA8' }}>{LABELS[client.type_forfait] ?? client.type_forfait}</p>

              {client.seances_restantes === 0 ? (
                <div style={{ background: '#1A1215', border: '1px solid #3A1C22', borderRadius: 10, padding: '14px 16px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Forfait épuisé — aucune séance disponible</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#5A5D75' }}>Séances disponibles</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#4CAF78' }}>{client.seances_restantes} / {client.seances_totales}</span>
                  </div>
                  <div style={{ background: '#21242D', borderRadius: 100, height: 6, marginBottom: 4 }}>
                    <div style={{ background: '#4CAF78', borderRadius: 100, height: 6, width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', borderTop: '1px solid #2C2F3A' }}>
              <button onClick={reset} style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', borderRight: '1px solid #2C2F3A', color: '#8C8FA8', fontSize: 14, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={validateSession}
                disabled={client.seances_restantes === 0}
                style={{ flex: 2, padding: '14px', background: client.seances_restantes === 0 ? '#1A1C22' : '#4CAF78', border: 'none', color: client.seances_restantes === 0 ? '#3A3D4A' : '#0D1F17', fontSize: 14, fontWeight: 700, cursor: client.seances_restantes === 0 ? 'not-allowed' : 'pointer' }}
              >
                Valider la séance
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ background: '#111C16', border: '1px solid #2D4A3E', borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF78' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4CAF78' }}>Séance validée</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5A5D75' }}>{message}</p>
            <button onClick={reset} style={{ padding: '11px 24px', background: '#4CAF78', border: 'none', borderRadius: 8, color: '#0D1F17', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Scanner un autre client
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div style={{ background: '#1A1215', border: '1px solid #3A1C22', borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }}>Erreur</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5A5D75' }}>{message}</p>
            <button onClick={reset} style={{ padding: '11px 24px', background: 'transparent', border: '1px solid #3A1C22', borderRadius: 8, color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
