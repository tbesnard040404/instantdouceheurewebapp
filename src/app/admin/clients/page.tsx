'use client'

import { useEffect, useState } from 'react'

const LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  regulier: 'Régulier',
  intensif: 'Intensif',
  grossesse: 'Grossesse',
  perinatalite: 'Périnatalité',
  cadeau: 'Carte cadeau',
}

interface Client {
  id: string
  nom: string
  email: string
  type_forfait: string
  seances_restantes: number
  seances_totales: number
  actif: boolean
  expires_at: string | null
  created_at: string
}

const S = {
  page: { minHeight: '100vh', background: '#1A2820', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #243029' },
  navTitle: { margin: 0, fontSize: 13, color: '#7AA394', letterSpacing: '.1em', textTransform: 'uppercase' as const },
  navLinks: { display: 'flex', gap: 4 },
  navLink: (active: boolean) => ({ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : '#7AA394', background: active ? '#3D6255' : 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'none' }),
  main: { padding: '24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  h1: { margin: 0, fontSize: 22, fontWeight: 400, fontFamily: 'Georgia,serif', color: '#E4EDE8' },
  badge: { padding: '4px 10px', background: '#243029', borderRadius: 20, color: '#7AA394', fontSize: 12 },
  search: { width: '100%', padding: '10px 14px', background: '#243029', border: '1px solid #2C3A33', borderRadius: 8, color: '#E4EDE8', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' as const },
  tableWrap: { overflowX: 'auto' as const, borderRadius: 10, border: '1px solid #243029' },
  table: { width: '100%', borderCollapse: 'collapse' as const, minWidth: 780 },
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#5A6E68', background: '#1E2E26', borderBottom: '1px solid #243029', whiteSpace: 'nowrap' as const },
  td: { padding: '14px 16px', borderBottom: '1px solid #1E2E26', fontSize: 14, color: '#C8D8D0', verticalAlign: 'middle' as const },
  tdMuted: { padding: '14px 16px', borderBottom: '1px solid #1E2E26', fontSize: 13, color: '#5A6E68', verticalAlign: 'middle' as const },
  pill: (ok: boolean) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: ok ? '#1A3025' : '#2C1515', color: ok ? '#4CAF78' : '#F87171' }),
  stepper: { display: 'flex', alignItems: 'center', gap: 6 },
  stepBtn: (disabled: boolean) => ({ width: 28, height: 28, borderRadius: 6, border: '1px solid #2C3A33', background: disabled ? '#1A2820' : '#243029', color: disabled ? '#3D4A44' : '#7AA394', fontSize: 18, lineHeight: '1', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }),
  stepVal: { minWidth: 32, textAlign: 'center' as const, fontSize: 16, fontWeight: 700, color: '#E4EDE8' },
  toggleBtn: (active: boolean) => ({ padding: '5px 12px', borderRadius: 6, border: 'none', background: active ? '#1A3025' : '#2C1515', color: active ? '#4CAF78' : '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
  empty: { textAlign: 'center' as const, padding: '60px 24px', color: '#5A6E68' },
  saving: { fontSize: 11, color: '#7AA394', marginLeft: 4 },
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function patch(id: string, updates: Partial<Pick<Client, 'seances_restantes' | 'seances_totales' | 'actif'>>) {
    setSaving(id)
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    }
    setSaving(null)
  }

  const filtered = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    LABELS[c.type_forfait]?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <p style={S.navTitle}>Instant Douce'Heure — Admin</p>
        <div style={S.navLinks}>
          <a href="/admin/clients" style={S.navLink(true)}>Clients</a>
          <a href="/admin/scan" style={S.navLink(false)}>Scanner</a>
        </div>
      </nav>

      <div style={S.main}>
        <div style={S.header}>
          <h1 style={S.h1}>Gestion des clients</h1>
          <span style={S.badge}>{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>

        <input
          style={S.search}
          placeholder="Rechercher par nom, email ou forfait..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Client</th>
                <th style={S.th}>Forfait</th>
                <th style={S.th}>Séances restantes</th>
                <th style={S.th}>Total</th>
                <th style={S.th}>Statut</th>
                <th style={S.th}>Expiration</th>
                <th style={S.th}>Date d'achat</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#5A6E68' }}>Chargement...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={S.empty}>Aucun client trouvé</td></tr>
              )}
              {filtered.map(c => {
                const isSaving = saving === c.id
                const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false
                return (
                  <tr key={c.id} style={{ opacity: isSaving ? 0.6 : 1, transition: 'opacity .2s' }}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: '#E4EDE8', marginBottom: 2 }}>{c.nom}</div>
                      <div style={{ fontSize: 12, color: '#5A6E68' }}>{c.email}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ color: '#7AA394' }}>{LABELS[c.type_forfait] ?? c.type_forfait}</span>
                    </td>
                    <td style={S.td}>
                      <div style={S.stepper}>
                        <button
                          style={S.stepBtn(c.seances_restantes <= 0 || isSaving)}
                          disabled={c.seances_restantes <= 0 || isSaving}
                          onClick={() => patch(c.id, { seances_restantes: c.seances_restantes - 1 })}
                        >−</button>
                        <span style={S.stepVal}>{c.seances_restantes}</span>
                        <button
                          style={S.stepBtn(c.seances_restantes >= c.seances_totales || isSaving)}
                          disabled={c.seances_restantes >= c.seances_totales || isSaving}
                          onClick={() => patch(c.id, { seances_restantes: c.seances_restantes + 1 })}
                        >+</button>
                        {isSaving && <span style={S.saving}>...</span>}
                      </div>
                    </td>
                    <td style={S.tdMuted}>{c.seances_totales}</td>
                    <td style={S.td}>
                      <button
                        style={S.toggleBtn(c.actif)}
                        disabled={isSaving}
                        onClick={() => patch(c.id, { actif: !c.actif })}
                      >
                        {c.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td style={S.tdMuted}>
                      {c.expires_at
                        ? <span style={{ color: isExpired ? '#F87171' : '#B8966A' }}>
                            {new Date(c.expires_at).toLocaleDateString('fr-FR')}
                            {isExpired && ' ⚠️'}
                          </span>
                        : '—'}
                    </td>
                    <td style={S.tdMuted}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
