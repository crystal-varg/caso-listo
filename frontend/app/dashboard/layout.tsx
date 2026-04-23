'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, estudio, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate().then(() => {
      const { usuario } = useAuthStore.getState();
      if (!usuario) router.push('/login');
    });
  }, []);

  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Cargando...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: '🏠' },
    { href: '/dashboard/consultas', label: 'Consultas', icon: '📋' },
    { href: '/dashboard/honorarios', label: 'Honorarios', icon: '💰' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fb' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 240, background: '#fff', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', padding: '0', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>
            Caso<span style={{ color: '#4f46e5' }}>Listo</span>
          </div>
          {estudio && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>
              {estudio.nombre_estudio}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                  background: active ? '#eef2ff' : 'transparent',
                  color: active ? '#4f46e5' : '#374151',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}>
                  <span>{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Enlace al formulario público */}
        {estudio?.slug && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Tu formulario público
            </div>
            <a
              href={`/consulta/${estudio.slug}`}
              target="_blank"
              style={{
                display: 'block', fontSize: 12, color: '#4f46e5',
                background: '#eef2ff', padding: '8px 10px', borderRadius: 6,
                textDecoration: 'none', wordBreak: 'break-all', lineHeight: 1.4
              }}
            >
              /consulta/{estudio.slug} ↗
            </a>
          </div>
        )}

        {/* User footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{usuario.nombre}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{usuario.email}</div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
