// src/components/LoadingScreen.jsx
export default function LoadingScreen({ message = 'Loading records...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #080503 0%, #0F0A05 60%, #080503 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontSize: 48, animation: 'pulse 1.6s ease-in-out infinite' }}>🏺</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 13,
        color: 'var(--gold)', letterSpacing: '0.2em',
        animation: 'pulse 1.6s ease-in-out infinite',
      }}>{message.toUpperCase()}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--gold)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}
