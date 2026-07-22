'use client'

import { useEffect, useState, useCallback } from 'react'

const LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  regulier: 'Régulier',
  intensif: 'Intensif',
  grossesse: 'Grossesse',
  perinatalite: 'Périnatalité',
  cadeau: 'Carte cadeau',
}

const FORFAIT_COLOR: Record<string, string> = {
  essentiel: '#5B8C7A',
  regulier: '#3D6255',
  intensif: '#2A4A3E',
  grossesse: '#B8966A',
  perinatalite: '#8C6A8C',
  cadeau: '#C25B5B',
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
  notes: string
}

interface HistoryEntry {
  id: string
  validated_at: string
}

type Filter = 'all' | 'active' | 'low' | 'empty' | 'inactive'

function alertLevel(c: Client): 'ok' | 'low' | 'empty' | 'inactive' | 'expired' {
  if (!c.actif) return 'inactive'
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired'
  if (c.seances_restantes === 0) return 'empty'
  if (c.seances_restantes <= 2) return 'low'
  return 'ok'
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function patch(id: string, updates: Partial<Pick<Client, 'seances_restantes' | 'seances_totales' | 'actif' | 'notes'>>) {
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

  async function renew(id: string, nom: string) {
    setSaving(id)
    const res = await fetch(`/api/admin/clients/${id}/renew`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
      showToast(`✅ Forfait de ${nom} renouvelé`)
    }
    setSaving(null)
  }

  async function loadHistory(id: string) {
    if (history[id]) return
    const res = await fetch(`/api/admin/clients/${id}/history`)
    if (res.ok) {
      const data = await res.json()
      setHistory(prev => ({ ...prev, [id]: data }))
    }
  }

  function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null)
    } else {
      setExpanded(id)
      loadHistory(id)
    }
  }

  async function saveNote(id: string) {
    await patch(id, { notes: noteValue })
    setEditingNote(null)
    showToast('Note sauvegardée')
  }

  const filtered = clients.filter(c => {
    const matchSearch =
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (LABELS[c.type_forfait] ?? '').toLowerCase().includes(search.toLowerCase())

    const level = alertLevel(c)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? (c.actif && level === 'ok') :
      filter === 'low' ? level === 'low' :
      filter === 'empty' ? (level === 'empty' || level === 'expired') :
      filter === 'inactive' ? (level === 'inactive') :
      true

    return matchSearch && matchFilter
  })

  const counts = {
    all: clients.length,
    active: clients.filter(c => alertLevel(c) === 'ok').length,
    low: clients.filter(c => alertLevel(c) === 'low').length,
    empty: clients.filter(c => ['empty', 'expired'].includes(alertLevel(c))).length,
    inactive: clients.filter(c => alertLevel(c) === 'inactive').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1A2820', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', paddingBottom: 80 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#3D6255', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #243029', position: 'sticky', top: 0, background: '#1A2820', zIndex: 50 }}>
        <span style={{ fontSize: 12, color: '#7AA394', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>Instant Douce'Heure</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <a href="/admin/clients" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', background: '#3D6255', textDecoration: 'none' }}>Clients</a>
          <a href="/admin/scan" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#7AA394', textDecoration: 'none' }}>Scanner</a>
        </div>
      </nav>

      <div style={{ padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 400, fontFamily: 'Georgia,serif', color: '#E4EDE8' }}>
            Clients <span style={{ fontSize: 14, color: '#5A6E68', fontFamily: 'system-ui' }}>{clients.length}</span>
          </h1>
          <a
            href="/api/admin/export"
            style={{ padding: '8px 14px', background: '#243029', border: '1px solid #2C3A33', borderRadius: 8, color: '#7AA394', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ↓ Export CSV
          </a>
        </div>

        {/* Search */}
        <input
          style={{ width: '100%', padding: '11px 14px', background: '#243029', border: '1px solid #2C3A33', borderRadius: 10, color: '#E4EDE8', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
          placeholder="🔍  Nom, email ou forfait..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {([
            { key: 'all', label: `Tous (${counts.all})`, color: '#5A6E68' },
            { key: 'active', label: `✅ Actifs (${counts.active})`, color: '#4CAF78' },
            { key: 'low', label: `⚠️ Faibles (${counts.low})`, color: '#F59E0B' },
            { key: 'empty', label: `🔴 Épuisés (${counts.empty})`, color: '#F87171' },
            { key: 'inactive', label: `⏸ Inactifs (${counts.inactive})`, color: '#5A6E68' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === f.key ? f.color : '#2C3A33'}`, background: filter === f.key ? f.color + '22' : 'transparent', color: filter === f.key ? f.color : '#5A6E68', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#5A6E68' }}>Chargement...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#5A6E68', fontSize: 14 }}>Aucun client trouvé</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => {
            const level = alertLevel(c)
            const isSaving = saving === c.id
            const isOpen = expanded === c.id
            const pct = c.seances_totales > 0 ? Math.round((c.seances_restantes / c.seances_totales) * 100) : 0
            const borderColor = level === 'ok' ? '#2C3A33' : level === 'low' ? '#F59E0B44' : level === 'empty' || level === 'expired' ? '#F8717144' : '#2C3A33'
            const forfaitColor = FORFAIT_COLOR[c.type_forfait] ?? '#3D6255'

            return (
              <div key={c.id} style={{ background: '#1E2E26', border: `1px solid ${borderColor}`, borderRadius: 12, overflow: 'hidden', opacity: isSaving ? 0.7 : 1, transition: 'opacity .2s' }}>

                {/* Card header */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#E4EDE8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</span>
                        {level === 'low' && <span style={{ fontSize: 10, background: '#F59E0B22', color: '#F59E0B', padding: '2px 6px', borderRadius: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>⚠️ Faible</span>}
                        {(level === 'empty' || level === 'expired') && <span style={{ fontSize: 10, background: '#F8717122', color: '#F87171', padding: '2px 6px', borderRadius: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>Épuisé</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#5A6E68', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: forfaitColor + '33', color: forfaitColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {LABELS[c.type_forfait] ?? c.type_forfait}
                    </span>
                  </div>

                  {/* Progress + counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#243029', borderRadius: 100, height: 6, marginBottom: 6 }}>
                        <div style={{ background: level === 'empty' || level === 'expired' ? '#F87171' : level === 'low' ? '#F59E0B' : '#3D6255', borderRadius: 100, height: 6, width: `${pct}%`, transition: 'width .4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#5A6E68' }}>{c.seances_restantes} / {c.seances_totales} séances</div>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button
                        disabled={c.seances_restantes <= 0 || isSaving}
                        onClick={() => patch(c.id, { seances_restantes: c.seances_restantes - 1 })}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #2C3A33', background: c.seances_restantes <= 0 ? '#1A2820' : '#243029', color: c.seances_restantes <= 0 ? '#3D4A44' : '#7AA394', fontSize: 20, cursor: c.seances_restantes <= 0 ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#E4EDE8' }}>{c.seances_restantes}</span>
                      <button
                        disabled={c.seances_restantes >= c.seances_totales || isSaving}
                        onClick={() => patch(c.id, { seances_restantes: c.seances_restantes + 1 })}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #2C3A33', background: c.seances_restantes >= c.seances_totales ? '#1A2820' : '#243029', color: c.seances_restantes >= c.seances_totales ? '#3D4A44' : '#7AA394', fontSize: 20, cursor: c.seances_restantes >= c.seances_totales ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #243029' }}>
                  <button
                    onClick={() => patch(c.id, { actif: !c.actif })}
                    disabled={isSaving}
                    style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', borderRight: '1px solid #243029', color: c.actif ? '#4CAF78' : '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {c.actif ? '✅ Actif' : '⏸ Inactif'}
                  </button>
                  <button
                    onClick={() => renew(c.id, c.nom)}
                    disabled={isSaving}
                    style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', borderRight: '1px solid #243029', color: '#B8966A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔄 Renouveler
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(c.id)
                      setNoteValue(c.notes ?? '')
                    }}
                    style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', borderRight: '1px solid #243029', color: '#7AA394', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    📝 Note{c.notes ? ' •' : ''}
                  </button>
                  <button
                    onClick={() => toggleExpand(c.id)}
                    style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', color: '#7AA394', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {isOpen ? '▲ Fermer' : '▼ Historique'}
                  </button>
                </div>

                {/* Note editor */}
                {editingNote === c.id && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #243029', background: '#192820' }}>
                    <textarea
                      value={noteValue}
                      onChange={e => setNoteValue(e.target.value)}
                      placeholder="Ajouter une note (allergie, préférence, info utile...)"
                      style={{ width: '100%', padding: '10px', background: '#243029', border: '1px solid #2C3A33', borderRadius: 8, color: '#E4EDE8', fontSize: 13, resize: 'vertical', minHeight: 72, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => saveNote(c.id)}
                        style={{ flex: 1, padding: '9px', background: '#3D6255', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >Enregistrer</button>
                      <button
                        onClick={() => setEditingNote(null)}
                        style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #2C3A33', borderRadius: 8, color: '#7AA394', fontSize: 13, cursor: 'pointer' }}
                      >Annuler</button>
                    </div>
                  </div>
                )}

                {/* Current note display */}
                {c.notes && editingNote !== c.id && (
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #1A2820', background: '#192820' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#7AA394', fontStyle: 'italic' }}>📝 {c.notes}</p>
                  </div>
                )}

                {/* Expiry warning */}
                {c.expires_at && (
                  <div style={{ padding: '6px 16px', background: new Date(c.expires_at) < new Date() ? '#2C151522' : '#1A2820', borderTop: '1px solid #1A2820' }}>
                    <p style={{ margin: 0, fontSize: 11, color: new Date(c.expires_at) < new Date() ? '#F87171' : '#B8966A' }}>
                      ⏳ Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* History panel */}
                {isOpen && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #243029', background: '#192820' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, color: '#5A6E68', letterSpacing: '.08em', textTransform: 'uppercase' }}>Historique des séances</p>
                    {!history[c.id] && <p style={{ margin: 0, fontSize: 13, color: '#5A6E68' }}>Chargement...</p>}
                    {history[c.id]?.length === 0 && <p style={{ margin: 0, fontSize: 13, color: '#5A6E68' }}>Aucune séance enregistrée</p>}
                    {history[c.id]?.map((h, i) => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < history[c.id].length - 1 ? '1px solid #1A2820' : 'none' }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: '#3D6255', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#C8D8D0' }}>
                          {new Date(h.validated_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 12, color: '#5A6E68', marginLeft: 'auto' }}>
                          {new Date(h.validated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <p style={{ margin: '10px 0 0', fontSize: 11, color: '#3D4A44' }}>Achat le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
