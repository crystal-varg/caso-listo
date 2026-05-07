'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { href: '/admin/estudios', label: 'Estudios', icon: '🏢', exact: false },
  { href: '/admin/estudios/nuevo', label: 'Nuevo estudio', icon: '➕', exact: true },
];

function isActive(itemHref: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === itemHref;
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, logout, hydrate } = useAuthStore();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [hydrated, setHydrated] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) {
      // The login page is reachable without a session — don't hydrate or redirect.
      setHydrated(true);
      return;
    }
    hydrate().then(() => {
      const { usuario } = useAuthStore.getState();
      if (!usuario) {
        router.push('/admin/login');
        return;
      }
      if (usuario.role !== 'admin') {
        // Authenticated as a tenant — bounce them to their own panel's login,
        // not to /admin/login (would loop).
        router.push('/login');
        return;
      }
      setHydrated(true);
    });
    // Intentional empty deps: replicates dashboard/layout.tsx pattern; we only
    // run the auth gate on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  };

  // Login route: render bare children without sidebar/header.
  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!hydrated || !usuario || usuario.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Cargando...</div>
      </div>
    );
  }

  const isMobile = windowWidth < 768;
  const sidebarWidth = collapsed && !isMobile ? 64 : 224;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>
              Caso<span style={{ color: '#4f46e5' }}>Listo</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#dc2626',
              color: '#fff', padding: '1px 6px', borderRadius: 10,
            }}>
              ADMIN
            </span>
          </div>
        )}
        {collapsed && !isMobile && (
          <span style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>A</span>
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
                  background: active ? '#fee2e2' : 'transparent',
                  color: active ? '#dc2626' : '#374151',
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

      {/* Logout footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
        <button
          onClick={async () => { await logout(); router.push('/admin/login'); }}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: collapsed && !isMobile ? '8px 0' : '8px 10px',
            cursor: 'pointer',
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          title="Cerrar sesión"
        >
          {collapsed && !isMobile ? '⎋' : 'Cerrar sesión →'}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fb' }}>
      {!isMobile && sidebarContent}

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 6px', borderRadius: 6, color: '#374151' }}
            >
              ☰
            </button>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isMobile && (
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {usuario.nombre}
              </span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#dc2626',
              color: '#fff', padding: '2px 8px', borderRadius: 10, letterSpacing: '0.4px',
            }}>
              ADMIN
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
