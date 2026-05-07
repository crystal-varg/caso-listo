'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface EstudioAdmin {
  id: number;
  slug: string;
  nombre_estudio: string;
  config: { areas?: string[] } | null;
  usuario: { nombre: string; email: string } | null;
  createdAt: string;
}

interface CsvImportResult {
  creados: number;
  errores: Array<{ fila: number; motivo: string }>;
}

export default function AdminEstudiosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [estudios, setEstudios] = useState<EstudioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);
  const [csvError, setCsvError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api.get<EstudioAdmin[]>('/admin/estudios');
      setEstudios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los estudios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCsvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    // Reset the input so selecting the same file twice in a row still triggers onChange.
    e.target.value = '';
    if (!archivo) return;

    setCsvError('');
    setCsvResult(null);
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', archivo);
      // Direct fetch (not the api helper) so the browser can set the multipart
      // Content-Type with the correct boundary. The api helper would force
      // application/json and break the upload.
      const res = await fetch('/api/admin/estudios/csv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: `Error ${res.status}` }));
        throw new Error(body.message || `Error ${res.status}`);
      }
      const result: CsvImportResult = await res.json();
      setCsvResult(result);
      await cargar();
    } catch (err: any) {
      setCsvError(err.message || 'Error al importar el CSV.');
    } finally {
      setCsvUploading(false);
    }
  };

  const eliminar = async (estudio: EstudioAdmin) => {
    const ok = window.confirm(
      `¿Eliminar "${estudio.nombre_estudio}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await api.deleteWithBody(`/admin/estudios/${estudio.slug}`, { confirmar: true });
      await cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el estudio.');
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: '#111', margin: 0 }}>Estudios</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 13 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={csvUploading}
          >
            {csvUploading ? 'Subiendo...' : '📄 Importar CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleCsvSelected}
          />
          <Link href="/admin/estudios/nuevo" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: 13 }}>➕ Nuevo estudio</button>
          </Link>
        </div>
      </div>

      {csvError && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
          {csvError}
        </div>
      )}
      {csvResult && (
        <div style={{
          display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          marginBottom: 14, alignItems: 'center', flexWrap: 'wrap',
          background: csvResult.errores.length === 0 ? '#dcfce7' : '#fef3c7',
          color: csvResult.errores.length === 0 ? '#15803d' : '#b45309',
        }}>
          <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Creados: {csvResult.creados}</span>
          <span style={{ color: csvResult.errores.length > 0 ? '#dc2626' : '#9ca3af', fontWeight: 600 }}>
            Errores: {csvResult.errores.length}
          </span>
          {csvResult.errores.length > 0 && (
            <details style={{ width: '100%' }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>Ver detalle</summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#6b7280', fontSize: 12 }}>
                {csvResult.errores.map((e, i) => (
                  <li key={i}>Fila {e.fila}: {e.motivo}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
          Cargando estudios...
        </div>
      )}

      {!loading && error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && estudios.length === 0 && (
        <div className="card" style={{ padding: '44px 24px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Sin estudios todavía</div>
          <div style={{ fontSize: 13 }}>Creá uno desde "Nuevo estudio" o importá un CSV.</div>
        </div>
      )}

      {!loading && !error && estudios.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Slug</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Áreas</th>
                  <th style={thStyle}>Sitio</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((est, i) => {
                  const areasCount = est.config?.areas?.length ?? 0;
                  return (
                    <tr key={est.id} style={{ borderBottom: i < estudios.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#111' }}>{est.nombre_estudio}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: 12 }}>{est.slug}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#374151' }}>{est.usuario?.email ?? '—'}</span>
                      </td>
                      <td style={tdStyle}>
                        {areasCount > 0 ? (
                          <span style={{ fontSize: 12, color: '#374151' }}>{areasCount} áreas</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>Sin configurar</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <a
                          href={`https://${est.slug}.casolisto.com`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4f46e5', textDecoration: 'none', fontSize: 12 }}
                        >
                          {est.slug}.casolisto.com ↗
                        </a>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn-ghost"
                            style={{ fontSize: 12, padding: '4px 9px' }}
                            onClick={() => router.push(`/admin/estudios/${est.slug}`)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ fontSize: 12, padding: '4px 9px', color: '#dc2626' }}
                            onClick={() => eliminar(est)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '11px 16px',
  fontSize: 11,
  fontWeight: 700,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};
