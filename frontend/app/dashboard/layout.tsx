'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { SearchModal } from '@/components/SearchModal';
import Logo from '@/components/Logo';

const ICON_SIZE = 18;

const ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M4 21V9l8-6l8 6v12h-6v-7h-4v7z" />
    </svg>
  ),
  clipboard: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1" />
    </svg>
  ),
  balance: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M3 21q-.425 0-.712-.288T2 20t.288-.712T3 19h8V7.825q-.65-.225-1.125-.7T9.175 6H6l2.75 6.45q.125.275.15.563t-.025.587q-.225 1.15-1.237 1.775T5.5 16t-2.137-.625T2.125 13.6q-.05-.3-.025-.587t.15-.563L5 6H4q-.425 0-.712-.287T3 5t.288-.712T4 4h5.175q.3-.875 1.075-1.437T12 2t1.75.563T14.825 4H20q.425 0 .713.288T21 5t-.288.713T20 6h-1l2.75 6.45q.125.275.15.563t-.025.587q-.225 1.15-1.237 1.775T18.5 16t-2.137-.625t-1.238-1.775q-.05-.3-.025-.587t.15-.563L18 6h-3.175q-.225.65-.7 1.125t-1.125.7V19h8q.425 0 .713.288T22 20t-.288.713T21 21zm13.625-8h3.75L18.5 8.65zm-13 0h3.75L5.5 8.65zM12 6q.425 0 .713-.288T13 5t-.288-.712T12 4t-.712.288T11 5t.288.713T12 6" />
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1m-1 11h-5v5h5z" />
    </svg>
  ),
  people: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5m8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5" />
    </svg>
  ),
  currency: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M21 12v-2h-4V7h-2v3h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h6v3h-8v2h4v3h2v-3h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-6v-3Z" />
      <path fill="currentColor" d="M16 4A12 12 0 1 1 4 16A12.035 12.035 0 0 1 16 4m0-2a14 14 0 1 0 14 14A14.04 14.04 0 0 0 16 2" />
    </svg>
  ),
  documents: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M1.75 10v4c0 2.829 0 4.243.879 5.122c.217.217.467.38.763.504l-.019-.134c-.123-.918-.123-2.063-.123-3.393V7.902c0-1.33 0-2.476.123-3.393l.02-.134a2.3 2.3 0 0 0-.764.504C1.75 5.758 1.75 7.172 1.75 10m20 0v4c0 2.829 0 4.243-.879 5.122c-.217.217-.467.38-.763.504l.019-.134c.123-.918.123-2.063.123-3.393V7.902c0-1.33 0-2.476-.123-3.393l-.02-.134c.297.123.547.287.764.504c.879.879.879 2.293.879 5.121" />
      <path fill="currentColor" fillRule="evenodd" d="M5.629 2.879C4.75 3.757 4.75 5.172 4.75 8v8c0 2.828 0 4.243.879 5.121C6.507 22 7.922 22 10.75 22h2c2.828 0 4.243 0 5.121-.879c.879-.878.879-2.293.879-5.121V8c0-2.828 0-4.243-.879-5.121C16.993 2 15.578 2 12.75 2h-2c-2.828 0-4.243 0-5.121.879M8 17a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3A.75.75 0 0 1 8 17m.75-4.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5zM8 9a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6A.75.75 0 0 1 8 9" clipRule="evenodd" />
    </svg>
  ),
  gear: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: 'home', exact: true },
  { href: '/dashboard/consultas', label: 'Consultas', icon: 'clipboard' },
  { href: '/dashboard/casos', label: 'Casos', icon: 'balance' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: 'calendar' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: 'people' },
  { href: '/dashboard/honorarios', label: 'Honorarios', icon: 'currency' },
  { href: '/dashboard/documentos', label: 'Documentos', icon: 'documents' },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: 'gear' },
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
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}>
        {(!collapsed || isMobile) && (
          <div>
            <Logo height={24} />
            {estudio && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {estudio.nombre_estudio}
              </div>
            )}
          </div>
        )}
        {collapsed && !isMobile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo.svg"
            alt="CasoListo"
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
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
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{ICONS[item.icon]}</span>
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
