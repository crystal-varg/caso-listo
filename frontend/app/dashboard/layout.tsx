'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { SearchModal } from '@/components/SearchModal';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', exact: true },
  { href: '/dashboard/consultas', label: 'Consultas', icon: '📋' },
  { href: '/dashboard/casos', label: 'Casos', icon: '⚖️' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: '📅' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/honorarios', label: 'Honorarios', icon: '💰' },
  { href: '/dashboard/documentos', label: 'Documentos', icon: '📁' },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: '⚙️' },
];

function isActive(itemHref: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === itemHref;
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, estudio, logout, hydrate } = useAuthStore();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate().then(() => {
      const { usuario } = useAuthStore.getState();
      if (!usuario) router.push('/login');
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const isMobile = windowWidth < 768;
  const sidebarWidth = collapsed && !isMobile ? 64 : 224;

  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Cargando...</div>
      </div>
    );
  }

  const sidebarContent = (
    <aside style={{
      width: sidebarWidth,
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Logo + collapse toggle */}
      <div style={{
        padding: '18px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        minHeight: 60,
      }}>
        {(!collapsed || isMobile) && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>
              Caso<span style={{ color: '#4f46e5' }}>Listo</span>
            </div>
            {estudio && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {estudio.nombre_estudio}
              </div>
            )}
          </div>
        )}
        {collapsed && !isMobile && (
          <span style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5' }}>C</span>
        )}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '4px', borderRadius: 4, flexShrink: 0 }}
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, pathname, item.exact);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
              <div
                title={collapsed && !isMobile ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed && !isMobile ? '10px 0' : '9px 10px',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  borderRadius: 8,
                  marginBottom: 2,
                  background: active ? '#eef2ff' : 'transparent',
                  color: active ? '#4f46e5' : '#374151',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                {(!collapsed || isMobile) && item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Public form link */}
      {estudio?.slug && (!collapsed || isMobile) && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Formulario público
          </div>
          <a
            href={`/consulta/${estudio.slug}`}
            target="_blank"
            style={{
              display: 'block', fontSize: 11, color: '#4f46e5',
              background: '#eef2ff', padding: '6px 8px', borderRadius: 6,
              textDecoration: 'none', wordBreak: 'break-all', lineHeight: 1.4,
            }}
          >
            /consulta/{estudio.slug} ↗
          </a>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', gap: 8 }}>
        {(!collapsed || isMobile) && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fb' }}>
      {/* Desktop sidebar */}
      {!isMobile && sidebarContent}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
            {sidebarContent}
          </div>
        </>
      )}

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top navbar */}
        <header style={{
          height: 52,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 6px', borderRadius: 6, color: '#374151' }}
            >
              ☰
            </button>
          )}

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', color: '#6b7280', fontSize: 13,
              flex: isMobile ? 1 : undefined, maxWidth: isMobile ? undefined : 260,
            }}
          >
            <span>🔍</span>
            <span>Buscar consultas...</span>
            {!isMobile && <span style={{ marginLeft: 'auto', fontSize: 11, background: '#e5e7eb', padding: '1px 5px', borderRadius: 4 }}>Ctrl K</span>}
          </button>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <NotificationBell />

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: userMenuOpen ? '#f3f4f6' : 'none',
                border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 8px',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              {!isMobile && (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {usuario.nombre}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid #e5e7eb', minWidth: 180, zIndex: 200,
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{usuario.nombre}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{usuario.email}</div>
                </div>
                <Link href="/dashboard/configuracion" style={{ textDecoration: 'none' }}>
                  <div
                    onClick={() => setUserMenuOpen(false)}
                    style={{ padding: '9px 14px', fontSize: 13, color: '#374151', cursor: 'pointer' }}
                  >
                    ⚙️ Configuración
                  </div>
                </Link>
                <div
                  onClick={async () => { setUserMenuOpen(false); await logout(); router.push('/'); }}
                  style={{ padding: '9px 14px', fontSize: 13, color: '#dc2626', cursor: 'pointer', borderTop: '1px solid #f0f0f0' }}
                >
                  Cerrar sesión →
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
