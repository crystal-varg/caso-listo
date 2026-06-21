import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'CasoListo — Gestión para estudios jurídicos y contables',
  description:
    'CasoListo centraliza las consultas que recibís, las organiza automáticamente y te avisa al instante. Empezá gratis.',
};

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'inbox',   title: 'Captación automática', desc: 'Formulario personalizado para tu estudio. El cliente completa, vos recibís.' },
  { icon: 'bell',    title: 'Notificación inmediata', desc: 'Te avisamos por email cada vez que llega una consulta nueva.' },
  { icon: 'list',    title: 'Panel de prioridades', desc: 'Urgente, pendiente, listo. Sabés qué atender primero en segundos.' },
  { icon: 'balance', title: 'Clasificación por fuero', desc: 'Etiquetá cada caso: Laboral, Penal, Civil y más.' },
  { icon: 'chart',   title: 'Estado de cada caso', desc: 'Nuevo, en proceso, cerrado. Control total de tu agenda legal.' },
  { icon: 'shield',  title: 'Seguro y profesional', desc: 'Tus datos y los de tus clientes, protegidos.' },
];

// Inline icons (viewBox 24, fill=currentColor) so they inherit the brand tint.
const ICONS: Record<string, React.ReactNode> = {
  inbox: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M19 3H4.99c-1.11 0-1.98.9-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
    </svg>
  ),
  bell: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  list: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
    </svg>
  ),
  balance: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M3 21q-.425 0-.712-.288T2 20t.288-.712T3 19h8V7.825q-.65-.225-1.125-.7T9.175 6H6l2.75 6.45q.125.275.15.563t-.025.587q-.225 1.15-1.237 1.775T5.5 16t-2.137-.625T2.125 13.6q-.05-.3-.025-.587t.15-.563L5 6H4q-.425 0-.712-.287T3 5t.288-.712T4 4h5.175q.3-.875 1.075-1.437T12 2t1.75.563T14.825 4H20q.425 0 .713.288T21 5t-.288.713T20 6h-1l2.75 6.45q.125.275.15.563t-.025.587q-.225 1.15-1.237 1.775T18.5 16t-2.137-.625t-1.238-1.775q-.05-.3-.025-.587t.15-.563L18 6h-3.175q-.225.65-.7 1.125t-1.125.7V19h8q.425 0 .713.288T22 20t-.288.713T21 21zm13.625-8h3.75L18.5 8.65zm-13 0h3.75L5.5 8.65zM12 6q.425 0 .713-.288T13 5t-.288-.712T12 4t-.712.288T11 5t.288.713T12 6" />
    </svg>
  ),
  chart: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M4 9h4v11H4zm6-5h4v16h-4zm6 8h4v8h-4z" />
    </svg>
  ),
  shield: (
    <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  ),
};

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid #f0f0f0' }}>
        <Logo height={26} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login"><button className="btn-ghost">Ingresar</button></Link>
          <Link href="/register"><button className="btn-primary">Empezar gratis</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px' }}>
        <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          Para estudios jurídicos y contables
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#111', lineHeight: 1.15, maxWidth: 720, margin: '0 auto 20px' }}>
          Tus consultas, organizadas.<br /><span style={{ color: '#4f46e5' }}>Sin caos.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
          CasoListo centraliza todas las consultas que recibís, las organiza automáticamente y te avisa al instante.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register"><button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Crear mi cuenta gratis →</button></Link>
          <Link href="/login"><button className="btn-ghost" style={{ padding: '14px 32px', fontSize: 16 }}>Ya tengo cuenta</button></Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#f7f7fb', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 56, color: '#111' }}>
            Todo lo que necesitás en un solo lugar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding: '28px 24px' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {ICONS[f.icon]}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#111' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111', marginBottom: 16 }}>Empezá hoy, gratis.</h2>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 16 }}>Sin tarjeta de crédito. Sin contratos.</p>
        <Link href="/register"><button className="btn-primary" style={{ padding: '14px 40px', fontSize: 16 }}>Crear mi cuenta →</button></Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Logo height={20} />
        <div style={{ fontSize: 13, color: '#9ca3af' }}>© {new Date().getFullYear()} CasoListo</div>
      </footer>
    </div>
  );
}
