import Logo from '@/components/Logo';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f7f7fb',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Logo height={48} />
        <p style={{ color: '#6b7280', marginTop: 12, fontSize: 16 }}>
          El sistema de gestión para estudios jurídicos y contables.
        </p>
        <a href="/login" style={{
          display: 'inline-block', marginTop: 24,
          background: '#4f46e5', color: '#fff',
          padding: '12px 28px', borderRadius: 8,
          textDecoration: 'none', fontWeight: 600, fontSize: 15,
        }}>
          Ingresar al sistema
        </a>
      </div>
    </div>
  );
}
