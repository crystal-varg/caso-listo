'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Badge, ESTADO_CFG } from '@/components/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats { total: number; nuevo: number; en_proceso: number; cerrado: number; }

interface Consulta {
  id: number; nombre_cliente: string; email: string; mensaje: string;
  tipo_caso?: string; estado: string; fuero: string; urgencia: string; created_at: string;
}

interface Evento {
  id: number; titulo: string; tipo: string | null; fecha: string;
  completado: boolean; consulta_id: number;
  consulta: { nombre_cliente: string; tipo_caso?: string; };
}

interface Honorario {
  id: number; monto_total: number; monto_pagado: number; fecha_vencimiento: string;
  consulta_id: number;
  consulta: { nombre_cliente: string; tipo_caso?: string; fuero?: string; telefono?: string; };
}

interface SinMovimiento {
  id: number; nombre_cliente: string; tipo_caso: string | null;
  fuero: string; estado: string; dias_sin_movimiento: number;
}

interface PrioridadItem {
  id: string; emoji: string; titulo: string; descripcion: string;
  accion: string; color: string; bg: string; border: string;
  href?: string; waLink?: string; onAccion?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const fmtFechaCorta = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

function timeAgo(dateStr: string) {
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const casoLabel = (c: { tipo_caso?: string | null; fuero?: string }) =>
  c.tipo_caso || (c.fuero && c.fuero !== 'Sin definir' ? c.fuero : '') || 'Sin clasificar';

const waLink = (telefono: string | null | undefined, msg: string) =>
  telefono ? `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}` : null;

const TIPO_EVENTO_EMOJI: Record<string, string> = {
  audiencia: '⚖️', vencimiento: '📌', recordatorio: '🔔',
};

const URGENCIA_COLOR: Record<string, string> = { alta: '#ef4444', media: '#f59e0b', baja: '#10b981' };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { usuario, estudio } = useAuthStore();

  const [stats, setStats]               = useState<Stats | null>(null);
  const [consultas, setConsultas]       = useState<Consulta[]>([]);
  const [eventos, setEventos]           = useState<Evento[]>([]);
  const [honorarios, setHonorarios]     = useState<Honorario[]>([]);
  const [sinMov, setSinMov]             = useState<SinMovimiento[]>([]);
  const [loading, setLoading]           = useState(true);

  // Create-event modal
  const [eventoModal, setEventoModal] = useState<{
    consultaId: string; titulo: string; tipo: string; fecha: string;
  } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eventoError, setEventoError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [s, c, e, h, sm] = await Promise.all([
        api.get<Stats>('/consultas/stats'),
        api.get<Consulta[]>('/consultas'),
        api.get<Evento[]>('/eventos'),
        api.get<Honorario[]>('/honorarios'),
        api.get<SinMovimiento[]>('/consultas/sin-movimiento'),
      ]);
      setStats(s); setConsultas(c); setEventos(e); setHonorarios(h); setSinMov(sm);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando...</div>;

  // ── Time & greetings ──
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // ── Date windows ──
  const now = new Date();
  const hoy0 = new Date(now); hoy0.setHours(0, 0, 0, 0);
  const manana0 = new Date(hoy0.getTime() + 86400000);
  const en24h   = new Date(now.getTime() + 86400000);

  // ── Derived data ──
  const eventosHoy = eventos
    .filter(e => { const f = new Date(e.fecha); return f >= hoy0 && f < manana0 && !e.completado; })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const eventosProximos = eventos
    .filter(e => { const f = new Date(e.fecha); return f >= now && f < en24h && !e.completado; })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const consultasNuevas = consultas.filter(c => c.estado === 'nuevo');

  const honorariosPendientes = honorarios
    .filter(h => h.monto_pagado < h.monto_total)
    .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());

  const honorariosVencidos = honorariosPendientes.filter(
    h => new Date(h.fecha_vencimiento + 'T00:00:00') < hoy0
  );

  // ── Build priorities ──
  const prioridades: PrioridadItem[] = [];

  consultasNuevas.slice(0, 3).forEach(c => prioridades.push({
    id: `cn-${c.id}`,
    emoji: '📋',
    titulo: `Nueva consulta de ${c.nombre_cliente}`,
    descripcion: c.urgencia === 'alta' ? 'Urgente' : (casoLabel(c) === 'Sin clasificar' ? 'Sin clasificar' : casoLabel(c)),
    accion: 'Ver consulta',
    color: '#dc2626', bg: '#fff5f5', border: '#fca5a5',
    href: `/dashboard/consultas/${c.id}`,
  }));

  eventosProximos.slice(0, 3).forEach(e => prioridades.push({
    id: `ev-${e.id}`,
    emoji: TIPO_EVENTO_EMOJI[e.tipo || ''] || '📅',
    titulo: e.titulo,
    descripcion: `${casoLabel(e.consulta)} · ${fmtHora(e.fecha)}`,
    accion: 'Ver caso',
    color: '#b45309', bg: '#fffbeb', border: '#fde68a',
    href: `/dashboard/consultas/${e.consulta_id}`,
  }));

  honorariosVencidos.slice(0, 2).forEach(h => {
    const restante = h.monto_total - h.monto_pagado;
    const msg = `Hola ${h.consulta.nombre_cliente.split(' ')[0]}, te escribo por el pago pendiente de ${pesos(restante)}. ¿Cuándo lo coordinamos?`;
    const wa = waLink(h.consulta.telefono, msg);
    prioridades.push({
      id: `hv-${h.id}`,
      emoji: '💸',
      titulo: `Cobro vencido: ${h.consulta.nombre_cliente}`,
      descripcion: `${pesos(restante)} · venció ${fmtFechaCorta(h.fecha_vencimiento)}`,
      accion: wa ? '💬 Enviar WA' : 'Ver honorario',
      color: '#ea580c', bg: '#fff7ed', border: '#fdba74',
      href: wa ? undefined : '/dashboard/honorarios',
      waLink: wa || undefined,
    });
  });

  sinMov.slice(0, 2).forEach(c => prioridades.push({
    id: `sm-${c.id}`,
    emoji: '⚠️',
    titulo: `${c.nombre_cliente} — sin movimiento`,
    descripcion: `${c.dias_sin_movimiento} días sin actividad`,
    accion: 'Crear recordatorio',
    color: '#6b7280', bg: '#f9fafb', border: '#d1d5db',
    onAccion: () => abrirEventoModal(String(c.id), `Seguimiento con ${c.nombre_cliente}`),
  }));

  // ── Handlers ──
  const abrirEventoModal = (consultaId = '', titulo = '') =>
    setEventoModal({ consultaId, titulo, tipo: 'recordatorio', fecha: '' });

  const crearEvento = async () => {
    if (!eventoModal) return;
    setEventoError('');
    if (!eventoModal.consultaId) { setEventoError('Seleccioná una consulta.'); return; }
    if (!eventoModal.titulo.trim()) { setEventoError('El título es requerido.'); return; }
    if (!eventoModal.fecha) { setEventoError('La fecha es requerida.'); return; }
    setGuardando(true);
    try {
      await api.post('/eventos', {
        consulta_id: +eventoModal.consultaId,
        titulo: eventoModal.titulo,
        tipo: eventoModal.tipo,
        fecha: eventoModal.fecha,
      });
      setEventoModal(null);
      cargar();
    } catch (err: any) {
      setEventoError(err.message || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  const marcarCobrado = async (h: Honorario) => {
    await api.patch(`/honorarios/${h.id}`, { monto_pagado: h.monto_total }).catch(() => {});
    setHonorarios(prev => prev.map(x => x.id === h.id ? { ...x, monto_pagado: x.monto_total } : x));
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1080 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: '#111', margin: 0 }}>
            {saludo}, {usuario?.nombre?.split(' ')[0]}
          </h1>
          <p style={{ color: '#6b7280', marginTop: 5, fontSize: 14, margin: '5px 0 0' }}>
            {prioridades.length > 0
              ? `${prioridades.length} ${prioridades.length === 1 ? 'acción pendiente' : 'acciones pendientes'} hoy.`
              : 'Todo al día. Buen trabajo.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {estudio?.slug && (
            <a href={`/consulta/${estudio.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ fontSize: 13 }}>+ Nueva consulta</button>
            </a>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => abrirEventoModal()}>
            + Crear evento
          </button>
        </div>
      </div>

      {/* ── PRIORIDADES DEL DÍA ────────────────────────────────────────────── */}
      {prioridades.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Prioridades del día</span>
            <span style={{
              background: '#fee2e2', color: '#dc2626', fontSize: 11,
              fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            }}>{prioridades.length}</span>
          </div>
          {prioridades.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
              background: p.bg, borderLeft: `3px solid ${p.border}`,
              borderBottom: i < prioridades.length - 1 ? '1px solid #f7f7f7' : 'none',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.titulo}</div>
                <div style={{ fontSize: 12, color: p.descripcion === 'Urgente' ? '#ef4444' : '#6b7280', marginTop: 2 }}>{p.descripcion}</div>
              </div>
              {p.waLink ? (
                <a href={p.waLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>{p.accion}</button>
                </a>
              ) : p.href ? (
                <Link href={p.href} style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>{p.accion}</button>
                </Link>
              ) : (
                <button className="btn-ghost" style={{ fontSize: 12, flexShrink: 0 }} onClick={p.onAccion}>{p.accion}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STATS (compact row) ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total',      value: stats?.total      ?? 0, color: '#4f46e5' },
          { label: 'Nuevas',     value: stats?.nuevo      ?? 0, color: '#1d4ed8' },
          { label: 'En proceso', value: stats?.en_proceso ?? 0, color: '#b45309' },
          { label: 'Cerradas',   value: stats?.cerrado    ?? 0, color: '#065f46' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '13px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID: Agenda + Sin movimiento | Honorarios ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, marginBottom: 22 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Agenda del día */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/calendar.svg" alt="" width={18} height={18} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Hoy</span>
                {eventosHoy.length > 0 && (
                  <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                    {eventosHoy.length}
                  </span>
                )}
              </div>
              <button
                style={{ fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                onClick={() => abrirEventoModal()}
              >
                + Agregar
              </button>
            </div>
            {eventosHoy.length === 0 ? (
              <div style={{ padding: '22px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Sin eventos para hoy
              </div>
            ) : (
              eventosHoy.map((e, i) => (
                <Link key={e.id} href={`/dashboard/consultas/${e.consulta_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
                    borderBottom: i < eventosHoy.length - 1 ? '1px solid #f5f5f5' : 'none',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{TIPO_EVENTO_EMOJI[e.tipo || ''] || '📅'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{e.titulo}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{casoLabel(e.consulta)}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>{fmtHora(e.fecha)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Casos sin movimiento */}
          {sinMov.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Sin seguimiento</span>
                <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                  {sinMov.length}
                </span>
              </div>
              {sinMov.slice(0, 5).map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
                  borderBottom: i < Math.min(sinMov.length, 5) - 1 ? '1px solid #f5f5f5' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{c.nombre_cliente}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                      {c.tipo_caso || c.fuero || 'Sin clasificar'} · {c.dias_sin_movimiento}d sin actividad
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '4px 9px' }}
                      onClick={() => abrirEventoModal(String(c.id), `Seguimiento con ${c.nombre_cliente}`)}
                    >
                      Recordatorio
                    </button>
                    <Link href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none' }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 9px' }}>Ver →</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Honorarios pendientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/currency.svg" alt="" width={18} height={18} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Ingresos a cobrar</span>
            </div>
            <Link href="/dashboard/honorarios" style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
              Ver todos →
            </Link>
          </div>

          {honorariosPendientes.length === 0 ? (
            <div style={{ padding: '22px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Sin cobros pendientes
            </div>
          ) : (
            honorariosPendientes.slice(0, 5).map((h, i) => {
              const restante = h.monto_total - h.monto_pagado;
              const vencido = new Date(h.fecha_vencimiento + 'T00:00:00') < hoy0;
              const msg = `Hola ${h.consulta.nombre_cliente.split(' ')[0]}, te escribo por el pago pendiente de ${pesos(restante)}. ¿Cuándo podemos coordinarlo?`;
              const wa = waLink(h.consulta.telefono, msg);
              return (
                <div key={h.id} style={{
                  padding: '11px 16px',
                  borderLeft: vencido ? '3px solid #dc2626' : '3px solid transparent',
                  borderBottom: i < Math.min(honorariosPendientes.length, 5) - 1 ? '1px solid #f5f5f5' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.consulta.nombre_cliente}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 1, color: vencido ? '#dc2626' : '#9ca3af' }}>
                        {vencido ? '⚠ Vencido ' : 'Vence '}{fmtFechaCorta(h.fecha_vencimiento)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: vencido ? '#dc2626' : '#374151', marginLeft: 8, flexShrink: 0 }}>
                      {pesos(restante)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icons/whatsapp.svg" alt="" width={14} height={14} style={{ flexShrink: 0 }} />
                          WA
                        </button>
                      </a>
                    )}
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '3px 9px' }}
                      onClick={() => marcarCobrado(h)}
                    >
                      ✓ Cobrado
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CONSULTAS RECIENTES ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Consultas recientes</span>
          <Link href="/dashboard/consultas" style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
            Ver todas →
          </Link>
        </div>

        {consultas.length === 0 ? (
          <div style={{ padding: '44px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin consultas aún</div>
            <div style={{ fontSize: 13 }}>Cuando lleguen, las vas a ver acá.</div>
          </div>
        ) : (
          consultas.slice(0, 6).map((c, i) => {
            const cfg = ESTADO_CFG[c.estado];
            return (
              <Link key={c.id} href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 20px',
                    borderBottom: i < Math.min(consultas.length, 6) - 1 ? '1px solid #f5f5f5' : 'none',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#eef2ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#4f46e5', fontSize: 14, flexShrink: 0,
                  }}>
                    {c.nombre_cliente.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{c.nombre_cliente}</span>
                      {c.urgencia && URGENCIA_COLOR[c.urgencia] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: URGENCIA_COLOR[c.urgencia], display: 'inline-block', flexShrink: 0 }} />}
                      {cfg && <Badge bg={cfg.bg} color={cfg.color}>{cfg.label}</Badge>}
                      {c.tipo_caso && <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.tipo_caso}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.mensaje}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginTop: 2 }}>{timeAgo(c.created_at)}</div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── EVENTO MODAL ───────────────────────────────────────────────────── */}
      {eventoModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>Crear evento</h2>
              <button onClick={() => setEventoModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Consulta *</label>
                <select className="input" value={eventoModal.consultaId}
                  onChange={e => setEventoModal(m => m && ({ ...m, consultaId: e.target.value }))}>
                  <option value="">Seleccioná una consulta...</option>
                  {consultas.filter(c => c.estado !== 'cerrado').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_cliente}{c.tipo_caso ? ` — ${c.tipo_caso}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={eventoModal.tipo}
                  onChange={e => setEventoModal(m => m && ({ ...m, tipo: e.target.value }))}>
                  <option value="recordatorio">🔔 Recordatorio</option>
                  <option value="audiencia">⚖️ Audiencia</option>
                  <option value="vencimiento">📌 Vencimiento</option>
                </select>
              </div>
              <div>
                <label className="label">Título *</label>
                <input className="input" placeholder="Ej: Audiencia de conciliación"
                  value={eventoModal.titulo}
                  onChange={e => setEventoModal(m => m && ({ ...m, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="label">Fecha y hora *</label>
                <input className="input" type="datetime-local"
                  value={eventoModal.fecha}
                  onChange={e => setEventoModal(m => m && ({ ...m, fecha: e.target.value }))} />
              </div>
              {eventoError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}>
                  {eventoError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="btn-primary" style={{ flex: 1 }}
                  onClick={crearEvento} disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Crear evento'}
                </button>
                <button className="btn-ghost" onClick={() => setEventoModal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
