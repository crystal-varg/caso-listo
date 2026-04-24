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
  created_at: string;
}

interface ClienteAgrupado {
  email: string;
  nombre: string;
  telefono: string | null;
  consultas: Consulta[];
}

function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

const COLORES = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626'];
function colorPorEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return COLORES[Math.abs(hash) % COLORES.length];
}

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nueva', en_proceso: 'En proceso', en_espera: 'En espera', cerrado: 'Cerrado',
};

export default function ClientesPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    api.get<Consulta[]>('/consultas')
      .then(setConsultas)
      .finally(() => setLoading(false));
  }, []);

  // Group by email
  const clientesMap = new Map<string, ClienteAgrupado>();
  for (const c of consultas) {
    const key = c.email.toLowerCase();
    if (!clientesMap.has(key)) {
      clientesMap.set(key, { email: c.email, nombre: c.nombre_cliente, telefono: c.telefono, consultas: [] });
    }
    clientesMap.get(key)!.consultas.push(c);
  }
  const clientes = Array.from(clientesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const q = search.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter(
        (cl) =>
          cl.nombre.toLowerCase().includes(q) ||
          cl.email.toLowerCase().includes(q) ||
          (cl.telefono ?? '').includes(q),
      )
    : clientes;

  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando clientes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0 }}>Clientes</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15, margin: '6px 0 0' }}>
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'} en total
          </p>
        </div>
        <input
          className="input"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {clientes.length === 0 ? 'Todavía no hay clientes' : `Sin resultados para "${search}"`}
          </div>
          {clientes.length === 0 && (
            <div style={{ fontSize: 13 }}>Los clientes aparecen cuando recibís consultas a través de tu formulario público.</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map((cl) => {
            const color = colorPorEmail(cl.email);
            const abierto = expandido === cl.email;
            const activos = cl.consultas.filter((c) => c.estado !== 'cerrado').length;
            return (
              <div key={cl.email} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpandido(abierto ? null : cl.email)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
                    {iniciales(cl.nombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cl.nombre}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cl.email}
                      {cl.telefono ? ` · ${cl.telefono}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {cl.consultas.length} {cl.consultas.length === 1 ? 'caso' : 'casos'}
                      {activos > 0 ? ` · ${activos} activo${activos !== 1 ? 's' : ''}` : ''}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{abierto ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded: case list */}
                {abierto && (
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 0' }}>
                    {cl.consultas.map((c) => (
                      <Link key={c.id} href={`/dashboard/consultas/${c.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 72px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.tipo_caso || c.fuero || 'Sin clasificar'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: c.estado === 'cerrado' ? '#f3f4f6' : c.estado === 'nuevo' ? '#dcfce7' : '#eef2ff',
                            color: c.estado === 'cerrado' ? '#9ca3af' : c.estado === 'nuevo' ? '#16a34a' : '#4f46e5',
                          }}>
                            {ESTADO_LABEL[c.estado] ?? c.estado}
                          </span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>→</span>
                        </div>
                      </Link>
                    ))}
                    {/* Contact actions */}
                    <div style={{ display: 'flex', gap: 8, padding: '10px 18px', borderTop: '1px solid #f7f7f7' }}>
                      <a
                        href={`mailto:${cl.email}`}
                        style={{ fontSize: 12, color: '#4f46e5', background: '#eef2ff', padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
                      >
                        ✉️ Email
                      </a>
                      {cl.telefono && (
                        <a
                          href={`https://wa.me/${cl.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${cl.nombre.split(' ')[0]}, te escribo desde el estudio.`)}`}
                          target="_blank"
                          style={{ fontSize: 12, color: '#16a34a', background: '#dcfce7', padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
