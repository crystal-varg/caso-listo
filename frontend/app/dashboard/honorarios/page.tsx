'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConsultaRef {
  id: number;
  nombre_cliente: string;
  email: string;
  telefono?: string;
  tipo_caso?: string;
  fuero?: string;
  estado: string;
}

interface Honorario {
  id: number;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string;
  consulta_id: number;
  consulta: ConsultaRef;
  created_at: string;
}

type Estado = 'atrasado' | 'por_vencer' | 'al_dia' | 'pagado';
type Filtro = 'todos' | 'atrasado' | 'por_vencer' | 'al_dia';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEstado(h: Honorario): Estado {
  if (h.monto_pagado >= h.monto_total) return 'pagado';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const venc = new Date(h.fecha_vencimiento + 'T00:00:00');
  const diff = Math.ceil((venc.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'atrasado';
  if (diff <= 3) return 'por_vencer';
  return 'al_dia';
}

function casoLabel(c: ConsultaRef): string {
  return c.tipo_caso || (c.fuero && c.fuero !== 'Sin definir' ? c.fuero : '') || 'Sin clasificar';
}

function formatPeso(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function fmtFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const ESTADO_CFG: Record<Estado, { label: string; emoji: string; bg: string; color: string }> = {
  atrasado:   { label: 'Atrasado',   emoji: '🔴', bg: '#fee2e2', color: '#dc2626' },
  por_vencer: { label: 'Por vencer', emoji: '🟡', bg: '#fef3c7', color: '#b45309' },
  al_dia:     { label: 'Al día',     emoji: '🟢', bg: '#d1fae5', color: '#065f46' },
  pagado:     { label: 'Cobrado',    emoji: '✅', bg: '#f0fdf4', color: '#16a34a' },
};

const FILTROS: { key: Filtro; label: string; emoji?: string }[] = [
  { key: 'todos',      label: 'Todos' },
  { key: 'atrasado',   label: 'Atrasados',  emoji: '🔴' },
  { key: 'por_vencer', label: 'Por vencer', emoji: '🟡' },
  { key: 'al_dia',     label: 'Al día',     emoji: '🟢' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HonorariosPage() {
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [consultas, setConsultas] = useState<ConsultaRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  // Cobro inline state
  const [cobrandoId, setCobrandoId] = useState<number | null>(null);
  const [cobro, setCobro] = useState<{ tipo: 'total' | 'parcial'; monto: string }>({ tipo: 'total', monto: '' });
  const [cobroError, setCobroError] = useState('');

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState({ consulta_id: '', monto_total: '', monto_pagado: '0', fecha_vencimiento: '' });
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      api.get<Honorario[]>('/honorarios'),
      api.get<ConsultaRef[]>('/consultas'),
    ])
      .then(([h, c]) => { setHonorarios(h); setConsultas(c); })
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ──
  const totalPendiente = honorarios
    .filter(h => h.monto_total > h.monto_pagado)
    .reduce((s, h) => s + h.monto_total - h.monto_pagado, 0);
  const cntAtrasados  = honorarios.filter(h => getEstado(h) === 'atrasado').length;
  const cntPorVencer  = honorarios.filter(h => getEstado(h) === 'por_vencer').length;
  const cntAlDia      = honorarios.filter(h => ['al_dia', 'pagado'].includes(getEstado(h))).length;

  const filtrados = honorarios.filter(h => {
    if (filtro === 'todos') return true;
    const e = getEstado(h);
    return filtro === 'al_dia' ? e === 'al_dia' || e === 'pagado' : e === filtro;
  });

  // ── Cobro ──
  const registrarCobro = async (h: Honorario) => {
    setCobroError('');
    let nuevoPagado: number;

    if (cobro.tipo === 'total') {
      nuevoPagado = h.monto_total;
    } else {
      const adicional = parseFloat(cobro.monto.replace(/\./g, '').replace(',', '.'));
      if (isNaN(adicional) || adicional <= 0) {
        setCobroError('Ingresá un monto válido.');
        return;
      }
      nuevoPagado = Math.min(h.monto_total, h.monto_pagado + adicional);
    }

    try {
      const updated = await api.patch<Honorario>(`/honorarios/${h.id}`, { monto_pagado: nuevoPagado });
      setHonorarios(prev => prev.map(x => x.id === h.id ? { ...x, ...updated } : x));
      setCobrandoId(null);
      setCobro({ tipo: 'total', monto: '' });
    } catch (err: any) {
      setCobroError(err.message || 'Error al guardar.');
    }
  };

  // ── Eliminar ──
  const eliminarHonorario = async (id: number) => {
    if (!confirm('¿Eliminar este honorario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete<void>(`/honorarios/${id}`);
      setHonorarios(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar.');
    }
  };

  // ── Nuevo honorario ──
  const agregarHonorario = async () => {
    setFormError('');
    const total = parseFloat(nuevo.monto_total.replace(/\./g, '').replace(',', '.'));
    const pagado = parseFloat(nuevo.monto_pagado.replace(/\./g, '').replace(',', '.')) || 0;
    if (!nuevo.consulta_id) { setFormError('Seleccioná una consulta.'); return; }
    if (isNaN(total) || total <= 0) { setFormError('Ingresá un monto total válido.'); return; }
    if (!nuevo.fecha_vencimiento) { setFormError('La fecha de vencimiento es requerida.'); return; }

    setGuardando(true);
    try {
      const h = await api.post<Honorario>('/honorarios', {
        consulta_id: parseInt(nuevo.consulta_id),
        monto_total: total,
        monto_pagado: Math.min(pagado, total),
        fecha_vencimiento: nuevo.fecha_vencimiento,
      });
      setHonorarios(prev => [h, ...prev]);
      setNuevo({ consulta_id: '', monto_total: '', monto_pagado: '0', fecha_vencimiento: '' });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ──
  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando honorarios...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0 }}>Control de honorarios</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15, margin: '6px 0 0' }}>
            Seguimiento simple de pagos pendientes
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: 14 }}>
          + Nuevo honorario
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total pendiente', value: formatPeso(totalPendiente), color: '#4f46e5', border: '#4f46e5' },
          { label: 'Atrasados',       value: String(cntAtrasados),        color: '#dc2626', border: '#dc2626' },
          { label: 'Por vencer',      value: String(cntPorVencer),        color: '#b45309', border: '#b45309' },
          { label: 'Al día',          value: String(cntAlDia),            color: '#065f46', border: '#065f46' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button key={f.key} type="button" onClick={() => setFiltro(f.key)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1.5px solid ${filtro === f.key ? '#4f46e5' : '#e5e7eb'}`,
              background: filtro === f.key ? '#eef2ff' : '#fff',
              color: filtro === f.key ? '#4f46e5' : '#374151',
              fontWeight: filtro === f.key ? 600 : 400, transition: 'all 0.15s',
            }}>
            {f.emoji ? `${f.emoji} ` : ''}{f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {honorarios.length === 0 ? 'Todavía no hay honorarios' : 'Sin resultados para este filtro'}
          </div>
          {honorarios.length === 0 && (
            <div style={{ fontSize: 13 }}>
              Hacé clic en "+ Nuevo honorario" para empezar a registrar pagos de tus casos.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtrados.map(h => {
            const estado = getEstado(h);
            const cfg = ESTADO_CFG[estado];
            const restante = Math.max(0, h.monto_total - h.monto_pagado);
            const pct = h.monto_total > 0 ? Math.round((h.monto_pagado / h.monto_total) * 100) : 0;
            const cobrando = cobrandoId === h.id;

            return (
              <div key={h.id} className="card" style={{ padding: '20px 22px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{h.consulta.nombre_cliente}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{casoLabel(h.consulta)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
                    }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                    <button type="button" onClick={() => eliminarHonorario(h.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
                      title="Eliminar honorario">
                      ×
                    </button>
                  </div>
                </div>

                {/* Financials */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '12px 14px', background: '#f7f7fb', borderRadius: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total',  value: formatPeso(h.monto_total),  color: '#374151' },
                    { label: 'Pagado', value: formatPeso(h.monto_pagado), color: '#16a34a' },
                    { label: 'Falta',  value: restante > 0 ? formatPeso(restante) : '—', color: restante > 0 ? '#dc2626' : '#9ca3af' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.4s',
                      background: pct === 100 ? '#16a34a' : '#4f46e5',
                      width: `${pct}%`,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{pct}% cobrado</div>
                </div>

                {/* Date */}
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/calendar.svg" alt="" width={15} height={15} style={{ flexShrink: 0 }} />
                  Vence: {fmtFecha(h.fecha_vencimiento)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {restante > 0 && (
                    <button className="btn-ghost" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => {
                        const msg = `Hola ${h.consulta.nombre_cliente.split(' ')[0]}, te escribo por el saldo pendiente del caso "${casoLabel(h.consulta)}". Cuando puedas lo vemos.`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icons/whatsapp.svg" alt="" width={15} height={15} style={{ flexShrink: 0 }} />
                      Recordatorio
                    </button>
                  )}
                  {restante > 0 && (
                    <button className="btn-primary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => {
                        setCobrandoId(cobrando ? null : h.id);
                        setCobro({ tipo: 'total', monto: '' });
                        setCobroError('');
                      }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icons/currency-white.svg" alt="" width={15} height={15} style={{ flexShrink: 0 }} />
                      {cobrando ? 'Cancelar' : 'Marcar cobrado'}
                    </button>
                  )}
                  <Link href={`/dashboard/consultas/${h.consulta_id}`} style={{ textDecoration: 'none' }}>
                    <button className="btn-ghost" style={{ fontSize: 13 }}>Ver caso →</button>
                  </Link>
                </div>

                {/* Inline cobro form */}
                {cobrando && restante > 0 && (
                  <div style={{ marginTop: 16, padding: '16px', background: '#f7f7fb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 12 }}>Registrar cobro</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {(['total', 'parcial'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setCobro(c => ({ ...c, tipo: t }))}
                          style={{
                            padding: '7px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                            border: `1.5px solid ${cobro.tipo === t ? '#4f46e5' : '#e5e7eb'}`,
                            background: cobro.tipo === t ? '#eef2ff' : '#fff',
                            color: cobro.tipo === t ? '#4f46e5' : '#6b7280',
                            fontWeight: cobro.tipo === t ? 600 : 400,
                          }}>
                          {t === 'total' ? `Cobro total (${formatPeso(restante)})` : 'Cobro parcial'}
                        </button>
                      ))}
                    </div>
                    {cobro.tipo === 'parcial' && (
                      <div style={{ marginBottom: 14 }}>
                        <label className="label">Monto cobrado $</label>
                        <input className="input" placeholder="Ej: 30000" value={cobro.monto}
                          onChange={e => setCobro(c => ({ ...c, monto: e.target.value }))}
                          style={{ maxWidth: 200 }} autoFocus />
                      </div>
                    )}
                    {cobroError && (
                      <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{cobroError}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => registrarCobro(h)}>
                        Confirmar
                      </button>
                      <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setCobrandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nuevo honorario */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Nuevo honorario</h2>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Consulta *</label>
                {consultas.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9ca3af', padding: '10px 0' }}>
                    No hay consultas disponibles. Primero recibí una consulta de un cliente.
                  </div>
                ) : (
                  <select className="input" value={nuevo.consulta_id}
                    onChange={e => setNuevo(n => ({ ...n, consulta_id: e.target.value }))}>
                    <option value="">Seleccioná una consulta...</option>
                    {consultas.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cliente}{c.tipo_caso ? ` — ${c.tipo_caso}` : c.fuero && c.fuero !== 'Sin definir' ? ` — ${c.fuero}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  El nombre del cliente y el caso se toman de la consulta existente.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Honorario total $ *</label>
                  <input className="input" placeholder="Ej: 120000"
                    value={nuevo.monto_total}
                    onChange={e => setNuevo(n => ({ ...n, monto_total: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ya cobrado $</label>
                  <input className="input" placeholder="0"
                    value={nuevo.monto_pagado}
                    onChange={e => setNuevo(n => ({ ...n, monto_pagado: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Fecha de vencimiento *</label>
                <input className="input" type="date"
                  value={nuevo.fecha_vencimiento}
                  onChange={e => setNuevo(n => ({ ...n, fecha_vencimiento: e.target.value }))} />
              </div>

              {formError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-primary" style={{ flex: 1 }}
                  onClick={agregarHonorario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar honorario'}
                </button>
                <button className="btn-ghost" onClick={() => { setShowForm(false); setFormError(''); }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
