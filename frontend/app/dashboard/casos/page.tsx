'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Consulta {
  id: number;
  nombre_cliente: string;
  email: string;
  telefono: string | null;
  tipo_caso: string | null;
  fuero: string;
  estado: string;
  urgencia: string | null;
  updated_at: string;
  created_at: string;
}

interface Evento {
  id: number;
  consulta_id: number;
  fecha: string;
  completado: boolean;
}

type Filtro = 'todos' | 'nuevo' | 'en_proceso' | 'en_espera';

const URGENCIA_CFG: Record<string, { color: string; bg: string; label: string }> = {
  alta:  { color: '#dc2626', bg: '#fee2e2', label: 'Urgente' },
  media: { color: '#b45309', bg: '#fef3c7', label: 'Media'  },
  baja:  { color: '#059669', bg: '#d1fae5', label: 'Baja'   },
};

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  nuevo:      { label: 'Nuevo',      color: '#16a34a', bg: '#dcfce7' },
  en_proceso: { label: 'En proceso', color: '#4f46e5', bg: '#eef2ff' },
  en_espera:  { label: 'En espera',  color: '#b45309', bg: '#fef3c7' },
  cerrado:    { label: 'Cerrado',    color: '#9ca3af', bg: '#f3f4f6' },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos',      label: 'Todos'       },
  { key: 'nuevo',      label: 'Nuevos'      },
  { key: 'en_proceso', label: 'En proceso'  },
  { key: 'en_espera',  label: 'En espera'   },
];

export default function CasosPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Consulta[]>('/consultas'),
      api.get<Evento[]>('/eventos'),
    ])
      .then(([c, e]) => { setConsultas(c); setEventos(e); })
      .finally(() => setLoading(false));
  }, []);

  // Build a quick lookup: consulta_id → próximo evento
  const proximoEvento: Record<number, string | null> = {};
  const now = Date.now();
  for (const ev of eventos) {
    if (!ev.completado && new Date(ev.fecha).getTime() > now) {
      if (!proximoEvento[ev.consulta_id]) {
        proximoEvento[ev.consulta_id] = ev.fecha;
      }
    }
  }

  const activos = consultas.filter((c) => c.estado !== 'cerrado');

  const q = search.trim().toLowerCase();
  const filtrados = activos
    .filter((c) => {
      if (filtro !== 'todos' && c.estado !== filtro) return false;
      if (q) {
        return (
          c.nombre_cliente.toLowerCase().includes(q) ||
          (c.tipo_caso ?? '').toLowerCase().includes(q) ||
          c.fuero.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const urgOrd: Record<string, number> = { alta: 0, media: 1, baja: 2 };
      return (urgOrd[a.urgencia ?? 'baja'] ?? 2) - (urgOrd[b.urgencia ?? 'baja'] ?? 2);
    });

  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando casos...</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Casos activos</h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
          {activos.length} caso{activos.length !== 1 ? 's' : ''} abierto{activos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Buscar por cliente, tipo, fuero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: `1.5px solid ${filtro === f.key ? '#4f46e5' : '#e5e7eb'}`,
                background: filtro === f.key ? '#eef2ff' : '#fff',
                color: filtro === f.key ? '#4f46e5' : '#374151',
                fontWeight: filtro === f.key ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases list */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontWeight: 600 }}>
            {activos.length === 0 ? 'Sin casos activos' : 'Sin resultados'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map((c) => {
            const estadoCfg = ESTADO_CFG[c.estado] ?? ESTADO_CFG.nuevo;
            const urgCfg = c.urgencia ? URGENCIA_CFG[c.urgencia] : null;
            const proximo = proximoEvento[c.id];
            return (
              <Link key={c.id} href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c7d2fe')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                    {c.nombre_cliente.charAt(0).toUpperCase()}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{c.nombre_cliente}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: estadoCfg.bg, color: estadoCfg.color }}>
                        {estadoCfg.label}
                      </span>
                      {urgCfg && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: urgCfg.bg, color: urgCfg.color }}>
                          {urgCfg.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: proximo ? 6 : 0 }}>
                      {c.tipo_caso || c.fuero}
                      {c.email ? ` · ${c.email}` : ''}
                    </div>
                    {proximo && (
                      <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 500 }}>
                        📅 Próximo evento: {new Date(proximo).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(proximo).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, paddingTop: 4 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
