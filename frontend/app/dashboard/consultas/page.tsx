'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge, URGENCIA_CFG, ESTADO_CFG } from '@/components/Badge';

interface Consulta {
  id: number; nombre_cliente: string; email: string; telefono: string;
  mensaje: string; estado: string; fuero: string; urgencia: string; created_at: string;
  score?: number;
  score_category?: 'ALTO' | 'MEDIO' | 'BAJO';
}

// Lead score (priority): ALTO = high priority → red, BAJO = low priority → green.
const SCORE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  ALTO:  { label: 'Alto',  bg: '#fee2e2', color: '#dc2626' },
  MEDIO: { label: 'Medio', bg: '#fef3c7', color: '#b45309' },
  BAJO:  { label: 'Bajo',  bg: '#dcfce7', color: '#15803d' },
};

const ESTADOS = ['todos', 'nuevo', 'en_proceso', 'cerrado'];
const FUEROS = ['todos', 'Laboral', 'Penal', 'Familia', 'Civil / Comercial', 'Administrativo', 'Tributario', 'Previsional', 'Sin definir'];

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [fueroFiltro, setFueroFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const cargar = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (estadoFiltro !== 'todos') params.set('estado', estadoFiltro);
    if (fueroFiltro !== 'todos') params.set('fuero', fueroFiltro);
    api.get<Consulta[]>(`/consultas?${params.toString()}`)
      .then(setConsultas)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [estadoFiltro, fueroFiltro]);

  const filtradas = consultas.filter((c) =>
    !busqueda || c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.mensaje.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Consultas</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{consultas.length} consulta{consultas.length !== 1 ? 's' : ''} en total</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Buscar por nombre, email o mensaje..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <select
          className="input"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          style={{ width: 'auto' }}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e === 'todos' ? 'Todos los estados' : e === 'en_proceso' ? 'En proceso' : e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
        <select
          className="input"
          value={fueroFiltro}
          onChange={(e) => setFueroFiltro(e.target.value)}
          style={{ width: 'auto' }}
        >
          {FUEROS.map((f) => (
            <option key={f} value={f}>{f === 'todos' ? 'Todos los fueros' : f}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600 }}>No hay consultas con estos filtros</div>
          </div>
        ) : (
          filtradas.map((c, i) => (
            <Link key={c.id} href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: i < filtradas.length - 1 ? '1px solid #f5f5f5' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4f46e5', fontSize: 15, flexShrink: 0 }}>
                  {c.nombre_cliente.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre_cliente}</span>
                    {c.score_category && SCORE_BADGE[c.score_category] && (
                      <Badge
                        title={typeof c.score === 'number' ? `Score: ${c.score}` : undefined}
                        bg={SCORE_BADGE[c.score_category].bg}
                        color={SCORE_BADGE[c.score_category].color}
                      >
                        {SCORE_BADGE[c.score_category].label.toUpperCase()}
                      </Badge>
                    )}
                    {c.urgencia && URGENCIA_CFG[c.urgencia] && (
                      <Badge bg={URGENCIA_CFG[c.urgencia].bg} color={URGENCIA_CFG[c.urgencia].color}>
                        {URGENCIA_CFG[c.urgencia].label}
                      </Badge>
                    )}
                    {ESTADO_CFG[c.estado] && (
                      <Badge bg={ESTADO_CFG[c.estado].bg} color={ESTADO_CFG[c.estado].color}>
                        {ESTADO_CFG[c.estado].label}
                      </Badge>
                    )}
                    {c.fuero && c.fuero !== 'Sin definir' && (
                      <Badge bg="#f3f4f6" color="#374151">{c.fuero}</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.email}{c.telefono ? ` · ${c.telefono}` : ''} — {c.mensaje}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, marginTop: 2 }}>{fmt(c.created_at)}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
