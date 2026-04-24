'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Consulta {
  id: number;
  nombre_cliente: string;
  email: string;
  tipo_caso: string | null;
  estado: string;
  fuero: string | null;
}

const ESTADO_LABEL: Record<string, string> = {
  nueva: 'Nueva',
  en_proceso: 'En proceso',
  en_espera: 'En espera',
  cerrado: 'Cerrado',
};

export function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    api.get<Consulta[]>('/consultas')
      .then(setConsultas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q
    ? consultas.filter(
        (c) =>
          c.nombre_cliente.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.tipo_caso ?? '').toLowerCase().includes(q) ||
          (c.fuero ?? '').toLowerCase().includes(q),
      )
    : consultas.slice(0, 8);

  const handleSelect = (c: Consulta) => {
    router.push(`/dashboard/consultas/${c.id}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '90%', maxWidth: 560,
        background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 301, overflow: 'hidden',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0f0f0', gap: 10 }}>
          <span style={{ fontSize: 16, color: '#9ca3af' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, email, tipo de caso..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              color: '#111', background: 'transparent',
            }}
          />
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#6b7280', cursor: 'pointer' }}
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Cargando...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Sin resultados para "{query}"
            </div>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  padding: '11px 16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 12, borderBottom: '1px solid #f7f7f7',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                  {c.nombre_cliente.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nombre_cliente}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.email}{c.tipo_caso ? ` · ${c.tipo_caso}` : ''}{c.fuero ? ` · ${c.fuero}` : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                  background: c.estado === 'cerrado' ? '#f3f4f6' : c.estado === 'nueva' ? '#dcfce7' : '#eef2ff',
                  color: c.estado === 'cerrado' ? '#9ca3af' : c.estado === 'nueva' ? '#16a34a' : '#4f46e5',
                  flexShrink: 0,
                }}>
                  {ESTADO_LABEL[c.estado] ?? c.estado}
                </span>
              </div>
            ))
          )}
        </div>

        {!loading && consultas.length > 0 && (
          <div style={{ padding: '8px 16px', fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f0f0f0' }}>
            {q ? `${results.length} resultado${results.length !== 1 ? 's' : ''}` : `${consultas.length} consultas en total`}
          </div>
        )}
      </div>
    </>
  );
}
