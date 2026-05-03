// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #080503 0%, #0D0804 50%, #080503 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
    backgroundImage: `
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(193,127,62,0.07) 0%, transparent 70%),
      radial-gradient(circle at 20% 80%, rgba(61,107,92,0.05) 0%, transparent 50%)
    `,
  },
  card: {
    width: '100%', maxWidth: 460,
    background: 'linear-gradient(160deg, rgba(20,14,8,0.98), rgba(12,8,4,0.98))',
    border: '1px solid rgba(193,127,62,0.25)',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(193,127,62,0.06)',
  },
  header: {
    padding: '36px 36px 28px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(193,127,62,0.12)',
    background: 'rgba(193,127,62,0.03)',
  },
  body: { padding: '32px 36px 36px' },
  label: {
    display: 'block', fontSize: 11,
    color: 'var(--gold)', fontFamily: 'var(--font-display)',
    letterSpacing: '0.1em', marginBottom: 8,
  },
  input: {
    width: '100%', padding: '12px 16px',
    fontSize: 15, borderRadius: 10, marginBottom: 18,
    background: 'rgba(8,5,3,0.9)',
    border: '1px solid rgba(193,127,62,0.22)',
    color: 'var(--text)',
  },
  btn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #6B4428, #C17F3E)',
    border: 'none', borderRadius: 10, color: '#F5ECD7',
    fontFamily: 'var(--font-display)', fontSize: 12,
    fontWeight: 700, letterSpacing: '0.1em',
    boxShadow: '0 4px 20px rgba(193,127,62,0.25)',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  googleBtn: {
    width: '100%', padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(193,127,62,0.25)',
    borderRadius: 10, color: 'var(--text)',
    fontFamily: 'var(--font-display)', fontSize: 11,
    letterSpacing: '0.08em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    transition: 'background 0.2s, border-color 0.2s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
    color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-display)',
  },
  error: {
    background: 'rgba(180,60,60,0.12)', border: '1px solid rgba(180,60,60,0.3)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E06060',
    marginBottom: 16, fontFamily: 'var(--font-body)',
  },
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password) return setError('Please fill in all fields.')
    if (mode === 'register' && !name) return setError('Please enter your name.')
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await loginWithEmail(email, password)
      else await registerWithEmail(email, password, name)
      navigate('/')
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.card} className="page-enter">
        <div style={S.header}>
          <div style={{ fontSize: 42, marginBottom: 14 }}>🏺</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 900, marginBottom: 6 }}>
            ANCESTRY RECORDS
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
            Community Lineage & Biography System
          </p>
          <div style={{ display: 'flex', gap: 0, marginTop: 20, background: 'rgba(8,5,3,0.5)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '9px', border: 'none',
                background: mode === m ? 'rgba(193,127,62,0.18)' : 'transparent',
                color: mode === m ? 'var(--gold)' : 'var(--text-dim)',
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.08em',
                transition: 'all 0.2s',
              }}>
                {m === 'login' ? 'SIGN IN' : 'REGISTER'}
              </button>
            ))}
          </div>
        </div>
        <div style={S.body}>
          {error && <div style={S.error}>⚠ {error}</div>}
          {mode === 'register' && (
            <>
              <label style={S.label}>FULL NAME</label>
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </>
          )}
          <label style={S.label}>EMAIL ADDRESS</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <label style={S.label}>PASSWORD</label>
          <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
          <div style={S.divider}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(193,127,62,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(193,127,62,0.25)' }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>
        </div>
      </div>
    </div>
  )
}
