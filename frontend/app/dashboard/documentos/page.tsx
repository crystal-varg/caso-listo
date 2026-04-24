'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, API_URL } from '@/lib/api';

interface Consulta {
  id: number;
  nombre_cliente: string;
  email: string;
  tipo_caso: string | null;
  fuero: string;
  estado: string;
  dni_archivo: string | null;
  docs_archivo: string | null;
  created_at: string;
}

type FiltroDoc = 'todos' | 'dni' | 'docs' | 'pendientes';

function extIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png'].includes(ext ?? '')) return '🖼️';
  if (['doc', 'docx'].includes(ext ?? '')) return '📝';
  return '📎';
}

function fmtNombre(raw: string): string {
  if (raw === 'faltante') return 'No disponible';
  return raw;
}

export default function DocumentosPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroDoc>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Consulta[]>('/consultas')
      .then(setConsultas)
      .finally(() => setLoading(false));
  }, []);

  const conDocumentos = consultas.filter(
    (c) => c.dni_archivo || c.docs_archivo,
  );

  const q = search.trim().toLowerCase();
  const filtrados = conDocumentos.filter((c) => {
    if (filtro === 'dni') return !!c.dni_archivo && c.dni_archivo !== 'faltante';
    if (filtro === 'docs') return !!c.docs_archivo && c.docs_archivo !== 'faltante';
    if (filtro === 'pendientes') {
      return (c.dni_archivo === null || c.docs_archivo === null);
    }
    if (q) {
      return (
        c.nombre_cliente.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tipo_caso ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }).filter((c) => {
    if (!q) return true;
    return (
      c.nombre_cliente.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.tipo_caso ?? '').toLowerCase().includes(q)
    );
  });

  const cntDni  = conDocumentos.filter((c) => c.dni_archivo && c.dni_archivo !== 'faltante').length;
  const cntDocs = conDocumentos.filter((c) => c.docs_archivo && c.docs_archivo !== 'faltante').length;
  const cntPend = consultas.filter((c) => c.dni_archivo === null || c.docs_archivo === null).length;

  if (loading) return <div style={{ color: '#6b7280', padding: 8 }}>Cargando documentos...</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Documentos</h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
          Archivos enviados por los clientes junto a sus consultas
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'DNI subidos',   value: cntDni,  color: '#4f46e5' },
          { label: 'Docs subidos',  value: cntDocs, color: '#7c3aed' },
          { label: 'Con pendientes',value: cntPend, color: '#b45309' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Buscar por cliente, tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'dni', label: 'DNI' },
            { key: 'docs', label: 'Documentos' },
            { key: 'pendientes', label: 'Pendientes' },
          ] as { key: FiltroDoc; label: string }[]).map((f) => (
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

      {/* List */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div style={{ fontWeight: 600 }}>
            {conDocumentos.length === 0
              ? 'Todavía no hay documentos subidos'
              : 'Sin resultados para este filtro'}
          </div>
          {conDocumentos.length === 0 && (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Los archivos aparecen cuando los clientes adjuntan documentos en el formulario público.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map((c) => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{c.nombre_cliente}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {c.tipo_caso || c.fuero}
                    {' · '}
                    {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <Link href={`/dashboard/consultas/${c.id}`} style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'none' }}>
                  Ver consulta →
                </Link>
              </div>

              {/* Files */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* DNI */}
                <div style={{
                  flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 8,
                  background: c.dni_archivo && c.dni_archivo !== 'faltante' ? '#f5f3ff' : c.dni_archivo === 'faltante' ? '#fef3c7' : '#f9fafb',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>
                    DNI
                  </div>
                  {c.dni_archivo && c.dni_archivo !== 'faltante' ? (
                    <a
                      href={`${API_URL}/consultas/archivos/${c.dni_archivo}`}
                      target="_blank"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      <span style={{ fontSize: 16 }}>{extIcon(c.dni_archivo)}</span>
                      <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fmtNombre(c.dni_archivo)}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>↓</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: c.dni_archivo === 'faltante' ? '#b45309' : '#9ca3af' }}>
                      {c.dni_archivo === 'faltante' ? '⚠️ No disponible' : '— No enviado'}
                    </span>
                  )}
                </div>

                {/* Documentos */}
                <div style={{
                  flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 8,
                  background: c.docs_archivo && c.docs_archivo !== 'faltante' ? '#f0fdf4' : c.docs_archivo === 'faltante' ? '#fef3c7' : '#f9fafb',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>
                    Documentación
                  </div>
                  {c.docs_archivo && c.docs_archivo !== 'faltante' ? (
                    <a
                      href={`${API_URL}/consultas/archivos/${c.docs_archivo}`}
                      target="_blank"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      <span style={{ fontSize: 16 }}>{extIcon(c.docs_archivo)}</span>
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fmtNombre(c.docs_archivo)}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>↓</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: c.docs_archivo === 'faltante' ? '#b45309' : '#9ca3af' }}>
                      {c.docs_archivo === 'faltante' ? '⚠️ No disponible' : '— No enviado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
