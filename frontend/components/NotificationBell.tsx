'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Notificacion {
  id: number;
  tipo: string;
  canal: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  consulta_id: number | null;
  wa_link: string | null;
  created_at: string;
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `${hs}h`;
  const dias = Math.floor(hs / 24);
  return `${dias}d`;
}

const TIPO_EMOJI: Record<string, string> = {
  consulta_nueva: '📋',
  evento_proximo: '📅',
  caso_sin_movimiento: '⚠️',
  honorario_vencido: '💸',
};

export function NotificationBell() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await api.get<Notificacion[]>('/notificaciones');
      setNotificaciones(data);
    } catch {}
  }, []);

  // On mount: trigger rule evaluation then fetch
  useEffect(() => {
    api.post('/notificaciones/evaluar', {}).catch(() => {}).finally(cargar);
    const interval = setInterval(cargar, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cargar]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  const handleClick = async (n: Notificacion) => {
    if (!n.leido) {
      api.patch(`/notificaciones/${n.id}/leer`, {}).catch(() => {});
      setNotificaciones((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, leido: true } : x)),
      );
    }
    setOpen(false);
    if (n.wa_link) {
      window.open(n.wa_link, '_blank');
    } else if (n.consulta_id) {
      router.push(`/dashboard/consultas/${n.consulta_id}`);
    }
  };

  const marcarTodas = () => {
    api.patch('/notificaciones/leer-todas', {}).catch(() => {});
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
        style={{
          position: 'relative',
          background: open ? '#eef2ff' : 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: '6px 8px',
          borderRadius: 8,
          lineHeight: 1,
          color: '#374151',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/bell.svg" alt="Notificaciones" width={18} height={18} style={{ display: 'block' }} />
        {noLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              background: '#dc2626',
              color: 'white',
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 20,
              minWidth: 15,
              height: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            border: '1px solid #e5e7eb',
            width: 320,
            maxHeight: 420,
            overflowY: 'auto',
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#fff',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
              Notificaciones {noLeidas > 0 && <span style={{ color: '#4f46e5' }}>({noLeidas})</span>}
            </span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                style={{
                  fontSize: 11,
                  color: '#4f46e5',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Items */}
          {notificaciones.length === 0 ? (
            <div
              style={{ padding: '28px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}
            >
              Sin notificaciones nuevas
            </div>
          ) : (
            notificaciones.slice(0, 25).map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid #f7f7f7',
                  cursor: 'pointer',
                  background: n.leido ? '#fff' : '#f5f7ff',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>
                  {TIPO_EMOJI[n.tipo] ?? '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: n.leido ? 500 : 700,
                        color: '#111',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.titulo}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                      {tiempoRelativo(n.created_at)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}
                  >
                    {n.mensaje}
                  </div>
                  {n.wa_link && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 10,
                        color: '#16a34a',
                        fontWeight: 600,
                      }}
                    >
                      💬 Abrir WhatsApp →
                    </span>
                  )}
                </div>
                {!n.leido && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#4f46e5',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
