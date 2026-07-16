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
      router.push('/admin/scan')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erreur')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1A2820', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#243029', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 360 }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7AA394' }}>Instant Douce'Heure</p>
        <h1 style={{ margin: '0 0 32px', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', color: '#E4EDE8' }}>Accès admin</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            style={{ width: '100%', padding: '12px 16px', background: '#1A2820', border: '1px solid #2C3A33', borderRadius: 8, color: '#E4EDE8', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
          />
          {error && <p style={{ margin: '0 0 16px', color: '#F87171', fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#3D6255', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
