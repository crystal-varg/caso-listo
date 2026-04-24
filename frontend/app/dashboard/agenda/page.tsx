'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Evento {
  id: number;
  consulta_id: number;
  consulta: { id: number; nombre_cliente: string; tipo_caso: string | null; fuero: string | null };
  titulo: string;
  tipo: string;
  fecha: string;
  completado: boolean;
  created_at: string;
}

interface Consulta {
  id: number;
  nombre_cliente: string;
  tipo_caso: string | null;
}

type Tab = 'proximos' | 'todos' | 'completados';

const TIPO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  audiencia:    { label: 'Audiencia',    color: '#7c3aed', bg: '#ede9fe' },
  vencimiento:  { label: 'Vencimiento',  color: '#dc2626', bg: '#fee2e2' },
  recordatorio: { label: 'Recordatorio', color: '#2563eb', bg: '#dbeafe' },
};

function fmtFechaGrupo(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const dDate = new Date(d); dDate.setHours(0, 0, 0, 0);
  if (dDate.getTime() === hoy.getTime()) return 'Hoy';
  if (dDate.getTime() === manana.getTime()) return 'Mañana';
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function fmtFechaInput(iso: string): string {
  return iso.slice(0, 16);
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('proximos');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ consulta_id: '', titulo: '', tipo: 'recordatorio', fecha: '' });
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Evento[]>('/eventos'),
      api.get<Consulta[]>('/consultas'),
    ])
      .then(([e, c]) => { setEventos(e); setConsultas(c); })
      .finally(() => setLoading(false));
  }, []);

  const toggleCompletado = async (ev: Evento) => {
    try {
      const updated = await api.patch<Evento>(`/eventos/${ev.id}`, { completado: !ev.completado });
      setEventos((prev) => prev.map((e) => (e.id === ev.id ? { ...e, ...updated } : e)));
    } catch {}
  };

  const crearEvento = async () => {
    setFormError('');
    if (!form.consulta_id) { setFormError('Seleccioná una consulta.'); return; }
    if (!form.titulo.trim()) { setFormError('El título es requerido.'); return; }
    if (!form.fecha) { setFormError('La fecha es requerida.'); return; }
    setGuardando(true);
    try {
      const ev = await api.post<Evento>('/eventos', {
        consulta_id: parseInt(form.consulta_id),
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        fecha: new Date(form.fecha).toISOString(),
      });
      setEventos((prev) => [ev, ...prev]);
      setForm({ consulta_id: '', titulo: '', tipo: 'recordatorio', fecha: '' });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const ahora = new Date();
  const filtrados = eventos.filter((ev) => {
    if (tab === 'completados') return ev.completado;
    if (tab === 'proximos') return !ev.completado && new Date(ev.fecha) >= ahora;
    return true;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Group by date
  const grupos: Record<string, Evento[]> = {};
  for (const ev of filtrados) {
    const key = new Date(ev.fecha).toDateString();
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(ev);
  }

  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando agenda...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0 }}>Agenda</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15, margin: '6px 0 0' }}>
            Audiencias, vencimientos y recordatorios
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: 14 }}>
          + Nuevo evento
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {([
          { key: 'proximos', label: 'Próximos' },
          { key: 'todos', label: 'Todos' },
          { key: 'completados', label: 'Completados' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', fontSize: 13, border: 'none', cursor: 'pointer',
              background: 'none', color: tab === t.key ? '#4f46e5' : '#6b7280',
              fontWeight: tab === t.key ? 700 : 400,
              borderBottom: tab === t.key ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Events */}
      {Object.keys(grupos).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {tab === 'proximos' ? 'No hay eventos próximos' : tab === 'completados' ? 'Sin eventos completados' : 'Sin eventos registrados'}
          </div>
          <div style={{ fontSize: 13 }}>Hacé clic en "+ Nuevo evento" para agregar uno.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grupos).map(([dateKey, evs]) => (
            <div key={dateKey}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                {fmtFechaGrupo(evs[0].fecha)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {evs.map((ev) => {
                  const tipoCfg = TIPO_LABEL[ev.tipo] ?? { label: ev.tipo, color: '#374151', bg: '#f3f4f6' };
                  return (
                    <div
                      key={ev.id}
                      style={{
                        background: '#fff', borderRadius: 10, padding: '14px 16px',
                        border: '1px solid #e5e7eb', display: 'flex', gap: 14, alignItems: 'flex-start',
                        opacity: ev.completado ? 0.6 : 1,
                      }}
                    >
                      {/* Time */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', minWidth: 48, textAlign: 'center', paddingTop: 2 }}>
                        {fmtHora(ev.fecha)}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: ev.completado ? '#9ca3af' : '#111', textDecoration: ev.completado ? 'line-through' : 'none' }}>
                            {ev.titulo}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: tipoCfg.bg, color: tipoCfg.color }}>
                            {tipoCfg.label}
                          </span>
                        </div>
                        {ev.consulta && (
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            {ev.consulta.nombre_cliente}
                            {ev.consulta.tipo_caso ? ` · ${ev.consulta.tipo_caso}` : ''}
                          </div>
                        )}
                      </div>
                      {/* Toggle */}
                      <button
                        onClick={() => toggleCompletado(ev)}
                        title={ev.completado ? 'Marcar pendiente' : 'Marcar completado'}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${ev.completado ? '#16a34a' : '#d1d5db'}`,
                          background: ev.completado ? '#16a34a' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 11,
                        }}
                      >
                        {ev.completado ? '✓' : ''}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Nuevo evento */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>Nuevo evento</h2>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Consulta *</label>
                <select className="input" value={form.consulta_id} onChange={(e) => setForm((f) => ({ ...f, consulta_id: e.target.value }))}>
                  <option value="">Seleccioná una consulta...</option>
                  {consultas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre_cliente}{c.tipo_caso ? ` — ${c.tipo_caso}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Título *</label>
                <input className="input" placeholder="Ej: Audiencia preliminar" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="recordatorio">Recordatorio</option>
                  <option value="audiencia">Audiencia</option>
                  <option value="vencimiento">Vencimiento</option>
                </select>
              </div>
              <div>
                <label className="label">Fecha y hora *</label>
                <input className="input" type="datetime-local" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
              </div>
              {formError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{formError}</div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={crearEvento} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear evento'}
                </button>
                <button className="btn-ghost" onClick={() => { setShowForm(false); setFormError(''); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
