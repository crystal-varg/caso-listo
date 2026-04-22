'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>Caso<span style={{ color: '#4f46e5' }}>Listo</span></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login"><button className="btn-ghost">Ingresar</button></Link>
          <Link href="/register"><button className="btn-primary">Empezar gratis</button></Link>
        </div>
      </nav>
      <section style={{ textAlign: 'center', padding: '100px 24px 80px' }}>
        <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>Para abogados que quieren trabajar mejor</div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#111', lineHeight: 1.15, maxWidth: 700, margin: '0 auto 20px' }}>Tus consultas, organizadas.<br /><span style={{ color: '#4f46e5' }}>Sin caos.</span></h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>CasoListo centraliza todas las consultas que recibís, las organiza automáticamente y te avisa al instante.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register"><button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Crear mi cuenta gratis →</button></Link>
          <Link href="/login"><button className="btn-ghost" style={{ padding: '14px 32px', fontSize: 16 }}>Ya tengo cuenta</button></Link>
        </div>
      </section>
      <section style={{ background: '#f7f7fb', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 56, color: '#111' }}>Todo lo que necesitás en un solo lugar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '📥', title: 'Captación automática', desc: 'Formulario personalizado para tu estudio. El cliente completa, vos recibís.' },
              { icon: '🔔', title: 'Notificación inmediata', desc: 'Te avisamos por email cada vez que llega una consulta nueva.' },
              { icon: '📋', title: 'Panel de prioridades', desc: 'Urgente, pendiente, listo. Sabés qué atender primero en segundos.' },
              { icon: '⚖️', title: 'Clasificación por fuero', desc: 'Etiquetá cada caso: Laboral, Penal, Civil y más.' },
              { icon: '📊', title: 'Estado de cada caso', desc: 'Nuevo, en proceso, cerrado. Control total de tu agenda legal.' },
              { icon: '🔒', title: 'Seguro y profesional', desc: 'Tus datos y los de tus clientes, protegidos.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ padding: '28px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#111' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111', marginBottom: 16 }}>Empezá hoy, gratis.</h2>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 16 }}>Sin tarjeta de crédito. Sin contratos.</p>
        <Link href="/register"><button className="btn-primary" style={{ padding: '14px 40px', fontSize: 16 }}>Crear mi cuenta →</button></Link>
      </section>
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#111' }}>Caso<span style={{ color: '#4f46e5' }}>Listo</span></div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>© {new Date().getFullYear()} CasoListo</div>
      </footer>
    </div>
  );
}
