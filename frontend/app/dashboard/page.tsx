'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

interface Stats { total: number; nuevo: number; en_proceso: number; cerrado: number; }
interface Consulta { id: number; nombre_cliente: string; email: string; mensaje: string; estado: string; fuero: string; urgencia: string; created_at: string; }

const estadoLabel: Record<string, { label: string; cls: string }> = {
  nuevo:      { label: 'Nuevo',      cls: 'badge-nuevo' },
  en_proceso: { label: 'En proceso', cls: 'badge-proceso' },
  cerrado:    { label: 'Cerrado',    cls: 'badge-cerrado' },
};

const urgenciaLabel: Record<string, string> = {
  alta: '🔴', media: '🟡', baja: '🟢',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export default function DashboardPage() {
  const { usuario } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/consultas/stats'),
      api.get<Consulta[]>('/consultas'),
    ]).then(([s, c]) => {
      setStats(s);
      setRecientes(c.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#6b7280' }}>Cargando...</div>;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0 }}>
          {saludo}, {usuario?.nombre?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15 }}>
          Acá está el resumen de tu estudio.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total de consultas', value: stats?.total ?? 0, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Nuevas', value: stats?.nuevo ?? 0, color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'En proceso', value: stats?.en_proceso ?? 0, color: '#b45309', bg: '#fef3c7' },
          { label: 'Cerradas', value: stats?.cerrado ?? 0, color: '#065f46', bg: '#d1fae5' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Consultas recientes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111' }}>Consultas recientes</h2>
          <Link href="/dashboard/consultas" style={{ fontSize: 13, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
            Ver todas →
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Todavía no hay consultas</div>
            <div style={{ fontSize: 13 }}>Cuando lleguen, las vas a ver acá.</div>
          </div>
        ) : (
          <div>
            {recientes.map((c, i) => (
              <Link key={c.id} href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  padding: '16px 24px',
                  borderBottom: i < recientes.length - 1 ? '1px solid #f5f5f5' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4f46e5', fontSize: 15, flexShrink: 0 }}>
                    {c.nombre_cliente.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre_cliente}</span>
                      {c.urgencia && <span>{urgenciaLabel[c.urgencia]}</span>}
                      <span className={`badge ${estadoLabel[c.estado]?.cls}`}>
                        {estadoLabel[c.estado]?.label}
                      </span>
                      {c.fuero && c.fuero !== 'Sin definir' && (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.fuero}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.mensaje}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(c.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
