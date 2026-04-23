'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Honorario {
  id: string;
  cliente: string;
  caso: string;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  consulta_id?: number;
}

type Estado = 'atrasado' | 'por_vencer' | 'al_dia' | 'pagado';
type Filtro = 'todos' | 'atrasado' | 'por_vencer' | 'al_dia';

const LS_KEY = 'caso_listo_honorarios';

function d(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

const SEED: Honorario[] = [
  { id: 'seed-1', cliente: 'Ana Martínez', caso: 'Divorcio', monto_total: 120000, monto_pagado: 60000, fecha_vencimiento: d(-5) },
  { id: 'seed-2', cliente: 'Carlos Gómez', caso: 'Laboral vs Empresa SA', monto_total: 85000, monto_pagado: 0, fecha_vencimiento: d(2) },
  { id: 'seed-3', cliente: 'María Rodríguez', caso: 'Sucesión', monto_total: 200000, monto_pagado: 200000, fecha_vencimiento: d(30) },
  { id: 'seed-4', cliente: 'Jorge Pérez', caso: 'Civil - Contrato', monto_total: 50000, monto_pagado: 0, fecha_vencimiento: d(15) },
];

function getEstado(h: Honorario): Estado {
  if (h.monto_total <= h.monto_pagado) return 'pagado';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const venc = new Date(h.fecha_vencimiento + 'T00:00:00');
  const diff = Math.ceil((venc.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'atrasado';
  if (diff <= 3) return 'por_vencer';
  return 'al_dia';
}

function formatPeso(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function fmtFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ESTADO_CONFIG: Record<Estado, { label: string; emoji: string; bg: string; color: string }> = {
  atrasado:  { label: 'Atrasado',   emoji: '🔴', bg: '#fee2e2', color: '#dc2626' },
  por_vencer:{ label: 'Por vencer', emoji: '🟡', bg: '#fef3c7', color: '#b45309' },
  al_dia:    { label: 'Al día',     emoji: '🟢', bg: '#d1fae5', color: '#065f46' },
  pagado:    { label: 'Cobrado',    emoji: '✅', bg: '#f0fdf4', color: '#16a34a' },
};

const FILTROS: { key: Filtro; label: string; emoji: string }[] = [
  { key: 'todos',      label: 'Todos',      emoji: '⚪' },
  { key: 'atrasado',   label: 'Atrasados',  emoji: '🔴' },
  { key: 'por_vencer', label: 'Por vencer', emoji: '🟡' },
  { key: 'al_dia',     label: 'Al día',     emoji: '🟢' },
];

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HonorariosPage() {
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cobrandoId, setCobrandoId] = useState<string | null>(null);
  const [cobro, setCobro] = useState<{ tipo: 'total' | 'parcial'; monto: string }>({ tipo: 'total', monto: '' });
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState({ cliente: '', caso: '', monto_total: '', monto_pagado: '0', fecha_vencimiento: '', consulta_id: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      setHonorarios(stored ? JSON.parse(stored) : SEED);
      if (!stored) localStorage.setItem(LS_KEY, JSON.stringify(SEED));
    } catch {
      setHonorarios(SEED);
    }
  }, []);

  const save = (h: Honorario[]) => {
    setHonorarios(h);
    localStorage.setItem(LS_KEY, JSON.stringify(h));
  };

  const registrarCobro = (id: string) => {
    save(honorarios.map(h => {
      if (h.id !== id) return h;
      if (cobro.tipo === 'total') return { ...h, monto_pagado: h.monto_total };
      const adicional = parseFloat(cobro.monto.replace(/\./g, '').replace(',', '.'));
      if (isNaN(adicional) || adicional <= 0) return h;
      return { ...h, monto_pagado: Math.min(h.monto_total, h.monto_pagado + adicional) };
    }));
    setCobrandoId(null);
    setCobro({ tipo: 'total', monto: '' });
  };

  const agregarHonorario = () => {
    setFormError('');
    const total = parseFloat(nuevo.monto_total.replace(/\./g, '').replace(',', '.'));
    const pagado = parseFloat(nuevo.monto_pagado.replace(/\./g, '').replace(',', '.')) || 0;
    if (!nuevo.cliente.trim()) { setFormError('El nombre del cliente es requerido.'); return; }
    if (!nuevo.caso.trim()) { setFormError('El nombre del caso es requerido.'); return; }
    if (isNaN(total) || total <= 0) { setFormError('Ingresá un monto total válido.'); return; }
    if (!nuevo.fecha_vencimiento) { setFormError('La fecha de vencimiento es requerida.'); return; }
    const h: Honorario = {
      id: `${Date.now()}`,
      cliente: nuevo.cliente.trim(),
      caso: nuevo.caso.trim(),
      monto_total: total,
      monto_pagado: Math.min(pagado, total),
      fecha_vencimiento: nuevo.fecha_vencimiento,
      ...(nuevo.consulta_id ? { consulta_id: parseInt(nuevo.consulta_id) } : {}),
    };
    save([h, ...honorarios]);
    setNuevo({ cliente: '', caso: '', monto_total: '', monto_pagado: '0', fecha_vencimiento: '', consulta_id: '' });
    setShowForm(false);
  };

  // Stats
  const totalPendiente = honorarios
    .filter(h => h.monto_total > h.monto_pagado)
    .reduce((sum, h) => sum + h.monto_total - h.monto_pagado, 0);
  const cntAtrasados = honorarios.filter(h => getEstado(h) === 'atrasado').length;
  const cntPorVencer = honorarios.filter(h => getEstado(h) === 'por_vencer').length;
  const cntAlDia = honorarios.filter(h => ['al_dia', 'pagado'].includes(getEstado(h))).length;

  const filtrados = honorarios.filter(h => {
    if (filtro === 'todos') return true;
    const e = getEstado(h);
    return filtro === 'al_dia' ? e === 'al_dia' || e === 'pagado' : e === filtro;
  });

  return (
    <div>
      {/* ── Header ── */}
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

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #4f46e5' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>Total pendiente</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{formatPeso(totalPendiente)}</div>
        </div>
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #dc2626' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>Atrasados</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{cntAtrasados}</div>
        </div>
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #b45309' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>Por vencer</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309' }}>{cntPorVencer}</div>
        </div>
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #065f46' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>Al día</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>{cntAlDia}</div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button key={f.key} type="button" onClick={() => setFiltro(f.key)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${filtro === f.key ? '#4f46e5' : '#e5e7eb'}`,
              background: filtro === f.key ? '#eef2ff' : '#fff',
              color: filtro === f.key ? '#4f46e5' : '#374151',
              fontWeight: filtro === f.key ? 600 : 400,
            }}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* ── Cards ── */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {filtro === 'todos' ? 'Todavía no hay honorarios' : 'Sin resultados para este filtro'}
          </div>
          {filtro === 'todos' && (
            <div style={{ fontSize: 13 }}>Hacé clic en "Nuevo honorario" para agregar uno.</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtrados.map(h => {
            const estado = getEstado(h);
            const cfg = ESTADO_CONFIG[estado];
            const restante = h.monto_total - h.monto_pagado;
            const pct = h.monto_total > 0 ? Math.round((h.monto_pagado / h.monto_total) * 100) : 0;
            const cobrando = cobrandoId === h.id;

            return (
              <div key={h.id} className="card" style={{ padding: '20px 22px' }}>
                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{h.cliente}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{h.caso}</div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
                  }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* Financials */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '12px 14px', background: '#f7f7fb', borderRadius: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total', value: formatPeso(h.monto_total), color: '#374151' },
                    { label: 'Pagado', value: formatPeso(h.monto_pagado), color: '#16a34a' },
                    { label: 'Falta', value: restante > 0 ? formatPeso(restante) : '—', color: restante > 0 ? '#dc2626' : '#9ca3af' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.4s',
                      background: pct === 100 ? '#16a34a' : pct > 0 ? '#4f46e5' : '#e5e7eb',
                      width: `${pct}%`,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{pct}% cobrado</div>
                </div>

                {/* Date */}
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                  📅 Vence: {fmtFecha(h.fecha_vencimiento)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {restante > 0 && (
                    <button className="btn-ghost" style={{ fontSize: 13 }}
                      onClick={() => {
                        const msg = `Hola ${h.cliente.split(' ')[0]}, te escribo por el saldo pendiente del caso "${h.caso}". Cuando puedas lo vemos.`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}>
                      💬 Recordatorio
                    </button>
                  )}
                  {restante > 0 && (
                    <button className="btn-primary" style={{ fontSize: 13 }}
                      onClick={() => { setCobrandoId(cobrando ? null : h.id); setCobro({ tipo: 'total', monto: '' }); }}>
                      💰 {cobrando ? 'Cancelar' : 'Marcar cobrado'}
                    </button>
                  )}
                  {h.consulta_id && (
                    <Link href={`/dashboard/consultas/${h.consulta_id}`} style={{ textDecoration: 'none' }}>
                      <button className="btn-ghost" style={{ fontSize: 13 }}>Ver caso →</button>
                    </Link>
                  )}
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
                        <input className="input" placeholder="Ej: 30000"
                          value={cobro.monto} onChange={e => setCobro(c => ({ ...c, monto: e.target.value }))}
                          style={{ maxWidth: 200 }} autoFocus />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => registrarCobro(h.id)}>
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

      {/* ── Modal: Nuevo honorario ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Nuevo honorario</h2>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Cliente *</label>
                <input className="input" placeholder="Ej: Ana Martínez" value={nuevo.cliente}
                  onChange={e => setNuevo(n => ({ ...n, cliente: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="label">Caso *</label>
                <input className="input" placeholder="Ej: Divorcio" value={nuevo.caso}
                  onChange={e => setNuevo(n => ({ ...n, caso: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Monto total $ *</label>
                  <input className="input" placeholder="120000" value={nuevo.monto_total}
                    onChange={e => setNuevo(n => ({ ...n, monto_total: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ya pagado $</label>
                  <input className="input" placeholder="0" value={nuevo.monto_pagado}
                    onChange={e => setNuevo(n => ({ ...n, monto_pagado: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Fecha de vencimiento *</label>
                <input className="input" type="date" value={nuevo.fecha_vencimiento}
                  onChange={e => setNuevo(n => ({ ...n, fecha_vencimiento: e.target.value }))} />
              </div>
              <div>
                <label className="label">ID de la consulta (opcional)</label>
                <input className="input" placeholder="Ej: 42" value={nuevo.consulta_id}
                  onChange={e => setNuevo(n => ({ ...n, consulta_id: e.target.value }))} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  Vincula este honorario con una consulta existente para usar el botón "Ver caso".
                </div>
              </div>

              {formError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={agregarHonorario}>
                  Guardar honorario
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
