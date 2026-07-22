'use client'

import { useEffect, useState, useCallback } from 'react'

const LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  regulier: 'Régulier',
  intensif: 'Intensif',
  grossesse: 'Grossesse',
  perinatalite: 'Périnatalité',
  cadeau: 'Cadeau',
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

interface HistoryEntry { id: string; validated_at: string }
type Filter = 'all' | 'active' | 'low' | 'empty' | 'inactive'

function alertLevel(c: Client): 'ok' | 'low' | 'empty' | 'inactive' | 'expired' {
  if (!c.actif) return 'inactive'
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired'
  if (c.seances_restantes === 0) return 'empty'
  if (c.seances_restantes <= 2) return 'low'
  return 'ok'
}

const C = {
  bg: '#111214',
  surface: '#1A1C22',
  surface2: '#21242D',
  border: '#2C2F3A',
  text: '#E4E6F0',
  text2: '#8C8FA8',
  text3: '#5A5D75',
  accent: '#4CAF78',
  accentBg: '#111C16',
  accentBorder: '#2D4A3E',
  warn: '#F59E0B',
  warnBg: '#171208',
  danger: '#EF4444',
  dangerBg: '#1A1215',
  dangerBorder: '#3A1C22',
}

const StatusDot = ({ level }: { level: ReturnType<typeof alertLevel> }) => {
  const color = level === 'ok' ? C.accent : level === 'low' ? C.warn : level === 'empty' || level === 'expired' ? C.danger : C.text3
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
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
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
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
      showToast(`Forfait de ${nom} renouvelé`)
    } else {
      showToast('Erreur lors du renouvellement', false)
    }
    setSaving(null)
  }

  async function loadHistory(id: string) {
    if (history[id]) return
    const res = await fetch(`/api/admin/clients/${id}/history`)
    if (res.ok) { const json = await res.json(); setHistory(prev => ({ ...prev, [id]: json })) }
  }

  function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    loadHistory(id)
  }

  async function saveNote(id: string) {
    await patch(id, { notes: noteValue })
    setEditingNote(null)
    showToast('Note enregistrée')
  }

  const filtered = clients.filter(c => {
    const s = search.toLowerCase()
    const match = c.nom.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (LABELS[c.type_forfait] ?? '').toLowerCase().includes(s)
    const level = alertLevel(c)
    const filterMatch = filter === 'all' ? true : filter === 'active' ? level === 'ok' : filter === 'low' ? level === 'low' : filter === 'empty' ? (level === 'empty' || level === 'expired') : level === 'inactive'
    return match && filterMatch
  })

  const counts = {
    all: clients.length,
    active: clients.filter(c => alertLevel(c) === 'ok').length,
    low: clients.filter(c => alertLevel(c) === 'low').length,
    empty: clients.filter(c => ['empty', 'expired'].includes(alertLevel(c))).length,
    inactive: clients.filter(c => alertLevel(c) === 'inactive').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', paddingBottom: 60 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? C.accentBg : C.dangerBg, border: `1px solid ${toast.ok ? C.accentBorder : C.dangerBorder}`, color: toast.ok ? C.accent : C.danger, padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.4)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontSize: 11, color: C.text3, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600 }}>Instant Douce'Heure</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <a href="/admin/clients" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#0D1F17', background: C.accent, textDecoration: 'none' }}>Clients</a>
          <a href="/admin/scan" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, color: C.text2, textDecoration: 'none' }}>Scanner</a>
        </div>
      </nav>

      <div style={{ padding: '20px', maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>Clients</h1>
            <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>{clients.length} enregistrement{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <a href="/api/admin/export" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </a>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Rechercher par nom, email ou forfait..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
          {([
            { key: 'all',      label: `Tous (${counts.all})`,           color: C.text2 },
            { key: 'active',   label: `Actifs (${counts.active})`,      color: C.accent },
            { key: 'low',      label: `Faibles (${counts.low})`,        color: C.warn },
            { key: 'empty',    label: `Épuisés (${counts.empty})`,      color: C.danger },
            { key: 'inactive', label: `Inactifs (${counts.inactive})`,  color: C.text3 },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === f.key ? f.color + '60' : C.border}`, background: filter === f.key ? f.color + '18' : 'transparent', color: filter === f.key ? f.color : C.text3, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 48, color: C.text3, fontSize: 14 }}>Chargement...</div>}
        {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: C.text3, fontSize: 14 }}>Aucun résultat</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const level = alertLevel(c)
            const isSaving = saving === c.id
            const isOpen = expanded === c.id
            const pct = c.seances_totales > 0 ? Math.round((c.seances_restantes / c.seances_totales) * 100) : 0
            const barColor = level === 'empty' || level === 'expired' ? C.danger : level === 'low' ? C.warn : C.accent

            return (
              <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', opacity: isSaving ? 0.6 : 1, transition: 'opacity .15s' }}>

                {/* Main row */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <StatusDot level={level} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</span>
                        {level === 'low' && <span style={{ fontSize: 10, fontWeight: 700, color: C.warn, background: C.warnBg, border: `1px solid ${C.warn}40`, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>Faible</span>}
                        {(level === 'empty' || level === 'expired') && <span style={{ fontSize: 10, fontWeight: 700, color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>{level === 'expired' ? 'Expiré' : 'Épuisé'}</span>}
                      </div>
                      <span style={{ fontSize: 12, color: C.text3 }}>{c.email}</span>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.surface2, color: C.text2, border: `1px solid ${C.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {LABELS[c.type_forfait] ?? c.type_forfait}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: C.surface2, borderRadius: 100, height: 4, marginBottom: 6 }}>
                        <div style={{ background: barColor, borderRadius: 100, height: 4, width: `${pct}%`, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: C.text3 }}>{c.seances_restantes} / {c.seances_totales} séances</span>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <button disabled={c.seances_restantes <= 0 || isSaving} onClick={() => patch(c.id, { seances_restantes: c.seances_restantes - 1 })}
                        style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface2, color: c.seances_restantes <= 0 ? C.border : C.text2, fontSize: 16, fontWeight: 700, cursor: c.seances_restantes <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: 30, textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.text }}>{c.seances_restantes}</span>
                      <button disabled={c.seances_restantes >= c.seances_totales || isSaving} onClick={() => patch(c.id, { seances_restantes: c.seances_restantes + 1 })}
                        style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface2, color: c.seances_restantes >= c.seances_totales ? C.border : C.text2, fontSize: 16, fontWeight: 700, cursor: c.seances_restantes >= c.seances_totales ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
                  {[
                    { label: c.actif ? 'Actif' : 'Inactif', color: c.actif ? C.accent : C.danger, action: () => patch(c.id, { actif: !c.actif }) },
                    { label: 'Renouveler', color: C.text2, action: () => renew(c.id, c.nom) },
                    { label: `Note${c.notes ? ' •' : ''}`, color: C.text2, action: () => { setEditingNote(c.id); setNoteValue(c.notes ?? '') } },
                    { label: isOpen ? 'Fermer' : 'Historique', color: C.text2, action: () => toggleExpand(c.id) },
                  ].map((btn, i, arr) => (
                    <button key={btn.label} onClick={btn.action} disabled={isSaving}
                      style={{ flex: 1, padding: '10px 4px', background: 'transparent', border: 'none', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', color: btn.color, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Note editor */}
                {editingNote === c.id && (
                  <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
                    <textarea value={noteValue} onChange={e => setNoteValue(e.target.value)} placeholder="Allergie, préférence, information utile..." rows={3}
                      style={{ width: '100%', padding: '10px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveNote(c.id)} style={{ flex: 1, padding: '9px', background: C.accent, border: 'none', borderRadius: 7, color: '#0D1F17', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
                      <button onClick={() => setEditingNote(null)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text2, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                )}

                {/* Note display */}
                {c.notes && editingNote !== c.id && (
                  <div style={{ padding: '8px 18px', borderTop: `1px solid ${C.bg}`, background: C.surface2 }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.text2, fontStyle: 'italic' }}>{c.notes}</p>
                  </div>
                )}

                {/* Expiry */}
                {c.expires_at && (
                  <div style={{ padding: '7px 18px', background: C.bg, borderTop: `1px solid ${C.surface2}` }}>
                    <span style={{ fontSize: 11, color: new Date(c.expires_at) < new Date() ? C.danger : '#B8966A' }}>
                      Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {new Date(c.expires_at) < new Date() ? ' — expiré' : ''}
                    </span>
                  </div>
                )}

                {/* History */}
                {isOpen && (
                  <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: C.text3, letterSpacing: '.1em', textTransform: 'uppercase' }}>Historique des séances</p>
                    {!history[c.id] && <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Chargement...</p>}
                    {history[c.id]?.length === 0 && <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Aucune séance enregistrée</p>}
                    {history[c.id]?.map((h, i) => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < history[c.id].length - 1 ? `1px solid ${C.surface}` : 'none' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accentBorder, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: C.text2 }}>{new Date(h.validated_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span style={{ fontSize: 12, color: C.text3, marginLeft: 'auto' }}>{new Date(h.validated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    <p style={{ margin: '12px 0 0', fontSize: 11, color: C.text3 }}>Client depuis le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
