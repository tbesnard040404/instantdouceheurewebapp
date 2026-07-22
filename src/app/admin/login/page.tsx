'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin/clients')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erreur de connexion')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#111214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: '#1C2E26', border: '1px solid #2D4A3E', marginBottom: 16 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#4CAF78' }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A5D75' }}>Instant Douce'Heure</p>
        </div>

        <div style={{ background: '#1A1C22', border: '1px solid #2C2F3A', borderRadius: 16, padding: '32px 28px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: '#E4E6F0', letterSpacing: '-.01em' }}>Connexion</h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#5A5D75' }}>Espace administrateur</p>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C8FA8', marginBottom: 6, letterSpacing: '.04em' }}>MOT DE PASSE</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{ width: '100%', padding: '11px 14px', background: '#111214', border: '1px solid #2C2F3A', borderRadius: 8, color: '#E4E6F0', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: error ? 10 : 20 }}
            />
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '9px 12px', background: '#1F1215', border: '1px solid #3A1C22', borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#EF4444' }}>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#2D4A3E' : '#4CAF78', border: 'none', borderRadius: 8, color: loading ? '#4CAF78' : '#0D1F17', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.02em', transition: 'background .15s' }}
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
