export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1
          className="brand"
          style={{ fontSize: '28px', marginBottom: '6px' }}
        >
          semana<span>.</span>
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: 'var(--muted)',
            margin: 0,
          }}
        >
          seu espaço de registro diário
        </p>
      </div>
      {children}
    </div>
  );
}
