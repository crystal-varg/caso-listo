'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface FormData {
  nombre_cliente: string;
  email: string;
  telefono: string;
  mensaje: string;
  urgencia: string;
}

export default function ConsultaPublicaPage() {
  const params = useParams();
  const [form, setForm] = useState<FormData>({
    nombre_cliente: '', email: '', telefono: '', mensaje: '', urgencia: 'media'
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mensaje.trim() || form.mensaje.trim().length < 20) {
      setError('Por favor contanos un poco más sobre tu situación (mínimo 20 caracteres).');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await api.post(`/consultas/publica/${params.slug}`, form);
      setEnviado(true);
    } catch (err: any) {
      setError(err.message || 'Hubo un error. Por favor intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7fb', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 12 }}>
            Consulta enviada
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7 }}>
            Recibimos tu consulta, <strong>{form.nombre_cliente.split(' ')[0]}</strong>. El abogado la revisará y te contactará a la brevedad a <strong>{form.email}</strong>.
          </p>
          <div style={{ marginTop: 32, padding: '16px 20px', background: '#eef2ff', borderRadius: 10, fontSize: 14, color: '#4f46e5', fontWeight: 500 }}>
            Tu consulta fue revisada antes de responder — esto garantiza una atención más precisa.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7fb', padding: '48px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 }}>
            Caso<span style={{ color: '#4f46e5' }}>Listo</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
            Envianos tu consulta
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Completá el formulario y te respondemos a la brevedad.
          </p>
        </div>

        {/* Aviso */}
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#4338ca', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span>ℹ️</span>
          <span>Esta consulta será revisada por el abogado antes de responder. No representa asesoramiento legal.</span>
        </div>

        {/* Formulario */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Nombre completo *</label>
                <input className="input" placeholder="Ej: María García" value={form.nombre_cliente} onChange={set('nombre_cliente')} required autoFocus />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" placeholder="11 1234-5678" value={form.telefono} onChange={set('telefono')} />
              </div>
            </div>

            <div>
              <label className="label">Urgencia</label>
              <select className="input" value={form.urgencia} onChange={set('urgencia')}>
                <option value="baja">🟢 Baja — Puedo esperar</option>
                <option value="media">🟡 Media — En los próximos días</option>
                <option value="alta">🔴 Alta — Es urgente</option>
              </select>
            </div>

            <div>
              <label className="label">Contanos tu situación *</label>
              <textarea
                className="input"
                placeholder="Describí brevemente tu situación o consulta. Cuanto más detalle, mejor podremos ayudarte..."
                value={form.mensaje}
                onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                required
                rows={6}
                style={{ resize: 'vertical', minHeight: 120 }}
              />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {form.mensaje.length} caracteres {form.mensaje.length < 20 && form.mensaje.length > 0 ? '— mínimo 20' : ''}
              </div>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={enviando}
              style={{ padding: '13px', fontSize: 15 }}
            >
              {enviando ? 'Enviando...' : 'Enviar consulta →'}
            </button>

            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Tu información es confidencial y no será compartida con terceros.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
