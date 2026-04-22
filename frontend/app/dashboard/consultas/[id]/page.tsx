'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Consulta {
  id: number; nombre_cliente: string; email: string; telefono: string;
  mensaje: string; estado: string; fuero: string; urgencia: string; tipo_caso: string; created_at: string;
}

const ESTADOS = ['nuevo', 'en_proceso', 'cerrado'];
const FUEROS = ['Laboral', 'Penal', 'Familia', 'Civil / Comercial', 'Administrativo', 'Tributario', 'Previsional', 'Sin definir'];

const estadoBadge: Record<string, { label: string; cls: string }> = {
  nuevo:      { label: 'Nuevo',      cls: 'badge-nuevo' },
  en_proceso: { label: 'En proceso', cls: 'badge-proceso' },
  cerrado:    { label: 'Cerrado',    cls: 'badge-cerrado' },
};

const urgLabel: Record<string, { label: string; emoji: string; cls: string }> = {
  alta:  { label: 'Alta',  emoji: '🔴', cls: 'badge-alta' },
  media: { label: 'Media', emoji: '🟡', cls: 'badge-media' },
  baja:  { label: 'Baja',  emoji: '🟢', cls: 'badge-baja' },
};

export default function ConsultaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api.get<Consulta>(`/consultas/${params.id}`)
      .then(setConsulta)
      .finally(() => setLoading(false));
  }, [params.id]);

  const update = async (campo: string, valor: string) => {
    if (!consulta) return;
    setSaving(true);
    try {
      const updated = await api.patch<Consulta>(`/consultas/${params.id}`, { [campo]: valor });
      setConsulta(updated);
      setSavedMsg('Guardado ✓');
      setTimeout(() => setSavedMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#9ca3af' }}>Cargando consulta...</div>;
  if (!consulta) return <div style={{ padding: 40, color: '#dc2626' }}>Consulta no encontrada.</div>;

  const fecha = new Date(consulta.created_at).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Back */}
      <Link href="/dashboard/consultas" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Volver a consultas
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
            {consulta.nombre_cliente}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${estadoBadge[consulta.estado]?.cls}`}>
              {estadoBadge[consulta.estado]?.label}
            </span>
            {consulta.urgencia && (
              <span className={`badge badge-${consulta.urgencia}`}>
                {urgLabel[consulta.urgencia]?.emoji} Urgencia {urgLabel[consulta.urgencia]?.label}
              </span>
            )}
          </div>
        </div>
        {savedMsg && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {savedMsg}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* Mensaje principal */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 12 }}>
            Consulta
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#111', whiteSpace: 'pre-wrap' }}>
            {consulta.mensaje}
          </p>
          <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>Recibida el {fecha}</div>
        </div>

        {/* Datos del cliente */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 16 }}>
            Datos del cliente
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#6b7280', width: 80, flexShrink: 0 }}>Email</span>
              <a href={`mailto:${consulta.email}`} style={{ fontSize: 14, color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                {consulta.email}
              </a>
            </div>
            {consulta.telefono && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6b7280', width: 80, flexShrink: 0 }}>Teléfono</span>
                <a href={`tel:${consulta.telefono}`} style={{ fontSize: 14, color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                  {consulta.telefono}
                </a>
              </div>
            )}
            {consulta.tipo_caso && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6b7280', width: 80, flexShrink: 0 }}>Tipo</span>
                <span style={{ fontSize: 14, color: '#111' }}>{consulta.tipo_caso}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clasificación — el abogado controla */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 16 }}>
            Clasificación del caso
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Fuero */}
            <div>
              <label className="label">Fuero</label>
              <select
                className="input"
                value={consulta.fuero}
                onChange={(e) => { setConsulta({ ...consulta, fuero: e.target.value }); update('fuero', e.target.value); }}
                disabled={saving}
              >
                {FUEROS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {/* Estado */}
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={consulta.estado}
                onChange={(e) => { setConsulta({ ...consulta, estado: e.target.value }); update('estado', e.target.value); }}
                disabled={saving}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e === 'nuevo' ? 'Nuevo' : e === 'en_proceso' ? 'En proceso' : 'Cerrado'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '12px 0 0' }}>
            Los cambios se guardan automáticamente al seleccionar.
          </p>
        </div>

        {/* Acciones rápidas */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={`mailto:${consulta.email}?subject=Re: Su consulta en nuestro estudio`} style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              ✉️ Responder por email
            </button>
          </a>
          {consulta.telefono && (
            <a href={`https://wa.me/${consulta.telefono.replace(/\D/g, '')}?text=Hola ${consulta.nombre_cliente}, te contacto por tu consulta.`} target="_blank" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                💬 WhatsApp
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
