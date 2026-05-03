// src/pages/CommunitiesPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  createCommunity, getUserCommunities, getPublicCommunities, joinCommunity
} from '../lib/db'

const CLANS_REGIONS = [
  'Dinka', 'Nuer', 'Zande', 'Bari', 'Acholi', 'Madi',
  'Lotuko', 'Murle', 'Shilluk', 'Mixed / Multi-Clan', 'Other'
]

export default function CommunitiesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [myCommunities, setMyCommunities] = useState([])
  const [publicCommunities, setPublicCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', region: '', clanGroup: '', description: '', isPublic: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCommunities()
  }, [user])

  async function loadCommunities() {
    setLoading(true)
    try {
      const [mine, pub] = await Promise.all([
        getUserCommunities(user.uid),
        getPublicCommunities()
      ])
      setMyCommunities(mine)
      setPublicCommunities(pub.filter(p => !mine.find(m => m.id === p.id)))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name.trim()) return setError('Community name is required.')
    setSaving(true); setError('')
    try {
      const ref = await createCommunity({
        name: form.name.trim(),
        region: form.region,
        clanGroup: form.clanGroup,
        description: form.description,
        isPublic: form.isPublic,
        adminIds: [user.uid],
        memberIds: [user.uid],
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
      })
      navigate(`/community/${ref.id}`)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  async function handleJoin(communityId) {
    try {
      await joinCommunity(communityId, user.uid)
      navigate(`/community/${communityId}`)
    } catch (e) { alert(e.message) }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 15, borderRadius: 10,
    marginBottom: 16, background: 'rgba(8,5,3,0.9)',
    border: '1px solid rgba(193,127,62,0.22)', color: 'var(--text)',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, color: 'var(--gold)',
    fontFamily: 'var(--font-display)', letterSpacing: '0.1em', marginBottom: 7,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #080503 0%, #0D0804 60%, #080503 100%)',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid rgba(193,127,62,0.15)',
        background: 'rgba(8,5,3,0.96)', backdropFilter: 'blur(20px)',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto', height: 62 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🏺</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.1em' }}>ANCESTRY RECORDS</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>Community Lineage System</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {user.displayName || user.email}
            </div>
            <button onClick={logout} style={{
              background: 'rgba(193,127,62,0.08)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', borderRadius: 8, padding: '6px 14px',
              fontSize: 11, letterSpacing: '0.06em', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            >SIGN OUT</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px' }}>
        {/* Hero */}
        <div className="page-enter" style={{ textAlign: 'center', marginBottom: 52, padding: '0 20px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.08em',
            marginBottom: 12, lineHeight: 1.2,
          }}>YOUR COMMUNITIES</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 17, fontFamily: 'var(--font-body)', fontStyle: 'italic', maxWidth: 560, margin: '0 auto 28px' }}>
            Each community holds a lineage. Preserve your ancestors' stories, connect generations, honour the living and the departed.
          </p>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'linear-gradient(135deg, #6B4428, #C17F3E)',
            border: 'none', color: '#F5ECD7', borderRadius: 12, padding: '13px 32px',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            boxShadow: '0 6px 28px rgba(193,127,62,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(193,127,62,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(193,127,62,0.3)' }}
          >+ CREATE NEW COMMUNITY</button>
        </div>

        {/* My Communities */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            MY COMMUNITIES
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontStyle: 'italic' }}>Loading...</div>
          ) : myCommunities.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              border: '1px dashed rgba(193,127,62,0.2)', borderRadius: 16,
              color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 16,
            }}>
              You haven't created or joined a community yet.<br />
              <span style={{ fontSize: 13, marginTop: 8, display: 'block' }}>Create one to start recording your lineage.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {myCommunities.map(c => (
                <CommunityCard key={c.id} community={c} onClick={() => navigate(`/community/${c.id}`)} isOwned={c.adminIds?.includes(user.uid)} />
              ))}
            </div>
          )}
        </section>

        {/* Public Communities */}
        {publicCommunities.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              PUBLIC COMMUNITIES — JOIN & CONTRIBUTE
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {publicCommunities.map(c => (
                <CommunityCard key={c.id} community={c} onJoin={() => handleJoin(c.id)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3,2,1,0.9)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={{
            background: 'linear-gradient(160deg, #0F0A05, #1A1008)',
            border: '1px solid rgba(193,127,62,0.3)',
            borderRadius: 18, width: '100%', maxWidth: 500,
            overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          }}>
            <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid var(--border)', background: 'rgba(193,127,62,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.12em' }}>CREATE NEW COMMUNITY</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '28px' }}>
              {error && <div style={{ background: 'rgba(180,60,60,0.12)', border: '1px solid rgba(180,60,60,0.3)', borderRadius: 8, padding: '10px 14px', color: '#E06060', marginBottom: 18, fontSize: 13 }}>⚠ {error}</div>}
              <label style={labelStyle}>COMMUNITY NAME *</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Majok Clan of Bahr el Ghazal" />
              <label style={labelStyle}>REGION / LOCATION</label>
              <input style={inputStyle} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. Bahr el Ghazal, South Sudan" />
              <label style={labelStyle}>CLAN GROUP</label>
              <select style={inputStyle} value={form.clanGroup} onChange={e => setForm(f => ({ ...f, clanGroup: e.target.value }))}>
                <option value="">Select clan group...</option>
                {CLANS_REGIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.7 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this community..." />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
                  background: form.isPublic ? 'var(--gold)' : 'rgba(193,127,62,0.2)',
                  position: 'relative', border: '1px solid rgba(193,127,62,0.3)',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
                    background: '#F5ECD7', transition: 'left 0.2s',
                    left: form.isPublic ? 22 : 2,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }} />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {form.isPublic ? 'Public — anyone can view and join' : 'Private — invite only'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 10, fontSize: 11, letterSpacing: '0.06em' }}>CANCEL</button>
                <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #6B4428, #C17F3E)', border: 'none', color: '#F5ECD7', borderRadius: 10, fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'CREATING...' : 'CREATE COMMUNITY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommunityCard({ community, onClick, onJoin, isOwned }) {
  return (
    <div style={{
      background: 'rgba(14,10,6,0.92)', border: '1px solid rgba(193,127,62,0.2)',
      borderRadius: 14, padding: '22px', cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.22s', position: 'relative', overflow: 'hidden',
    }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'rgba(193,127,62,0.6)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(193,127,62,0.12)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(193,127,62,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isOwned ? 'linear-gradient(90deg, var(--green), var(--gold))' : 'linear-gradient(90deg, var(--gold-dark), var(--gold))' }} />
      {isOwned && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', background: 'rgba(61,107,92,0.15)', border: '1px solid rgba(61,107,92,0.4)', borderRadius: 4, padding: '2px 7px' }}>ADMIN</div>
      )}
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏛</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text)', fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{community.name}</h3>
      {community.clanGroup && <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{community.clanGroup}</div>}
      {community.region && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'var(--font-body)' }}>📍 {community.region}</div>}
      {community.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14, fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>{community.description}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>👥 {community.memberCount || 1} member{(community.memberCount || 1) !== 1 ? 's' : ''}</span>
        {onJoin && (
          <button onClick={e => { e.stopPropagation(); onJoin() }} style={{
            background: 'rgba(193,127,62,0.12)', border: '1px solid rgba(193,127,62,0.35)',
            color: 'var(--gold)', borderRadius: 7, padding: '6px 14px',
            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.08em',
          }}>JOIN →</button>
        )}
      </div>
    </div>
  )
}
