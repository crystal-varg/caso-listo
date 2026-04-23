'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface FormData {
  nombre_cliente: string;
  email: string;
  telefono: string;
  mensaje: string;
  urgencia: string;
  tipo_caso: string;
  fecha_preferida: string;
  horario_preferido: string;
}

const TIPOS_CASO = [
  'Derecho Laboral',
  'Derecho de Familia',
  'Penal',
  'Civil / Comercial',
  'Administrativo',
  'Otro',
];

const URGENCIAS = [
  { value: 'alta', emoji: '🔴', label: 'Alta', desc: 'Es urgente' },
  { value: 'media', emoji: '🟡', label: 'Media', desc: 'En los próximos días' },
  { value: 'baja', emoji: '🟢', label: 'Baja', desc: 'Puedo esperar' },
];

const HORARIOS = ['9:00', '11:00', '14:00', '16:00', '18:00'];

const STEPS = [
  { number: 1, title: 'Tipo de consulta' },
  { number: 2, title: 'Detalle del caso' },
  { number: 3, title: 'Tus datos' },
  { number: 4, title: 'Agenda' },
];

export default function ConsultaPublicaPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    nombre_cliente: '', email: '', telefono: '', mensaje: '',
    urgencia: 'media', tipo_caso: '', fecha_preferida: '', horario_preferido: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const set = <K extends keyof FormData>(k: K) => (val: string) =>
    setForm(f => ({ ...f, [k]: val }));

  useEffect(() => {
    if (!form.fecha_preferida || step !== 4) return;
    setLoadingSlots(true);
    setOcupados([]);
    api.get<{ ocupados: string[] }>(
      `/consultas/publica/${slug}/disponibilidad?fecha=${form.fecha_preferida}`,
    )
      .then(data => setOcupados(data.ocupados))
      .catch(() => setOcupados([]))
      .finally(() => setLoadingSlots(false));
  }, [form.fecha_preferida, step, slug]);

  const canProceedStep1 = form.tipo_caso !== '';
  const canProceedStep2 = form.mensaje.trim().length >= 20;
  const canProceedStep3 = form.nombre_cliente.trim() !== '' && form.email.trim() !== '';

  const submitForm = async (data: FormData) => {
    setError('');
    setEnviando(true);
    try {
      await api.post(`/consultas/publica/${slug}`, data);
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 12 }}>Consulta enviada</h1>
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

  const urgSelected = URGENCIAS.find(u => u.value === form.urgencia);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7fb', padding: '48px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 }}>
            Caso<span style={{ color: '#4f46e5' }}>Listo</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Envianos tu consulta</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Completá el formulario y te respondemos a la brevedad.</p>
        </div>

        {/* Progress tracker */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.number} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                  background: step >= s.number ? '#4f46e5' : '#e5e7eb',
                  color: step >= s.number ? '#fff' : '#6b7280',
                  transition: 'all 0.2s',
                }}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span style={{
                  fontSize: 10, marginTop: 5, textAlign: 'center',
                  color: step >= s.number ? '#4f46e5' : '#9ca3af',
                  fontWeight: step === s.number ? 600 : 400,
                }}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  height: 2, flex: 1, marginTop: 15,
                  background: step > s.number ? '#4f46e5' : '#e5e7eb',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Notice */}
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#4338ca', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span>ℹ️</span>
          <span>Esta consulta será revisada por el abogado antes de responder. No representa asesoramiento legal.</span>
        </div>

        <div className="card">

          {/* Step 1: Tipo + urgencia */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label className="label">¿Qué tipo de consulta tenés?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  {TIPOS_CASO.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => set('tipo_caso')(tipo)}
                      style={{
                        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.tipo_caso === tipo ? '#4f46e5' : '#e5e7eb'}`,
                        background: form.tipo_caso === tipo ? '#eef2ff' : '#fff',
                        color: form.tipo_caso === tipo ? '#4f46e5' : '#374151',
                        fontWeight: form.tipo_caso === tipo ? 600 : 400,
                        fontSize: 14, textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Urgencia</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                  {URGENCIAS.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => set('urgencia')(u.value)}
                      style={{
                        padding: '12px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.urgencia === u.value ? '#4f46e5' : '#e5e7eb'}`,
                        background: form.urgencia === u.value ? '#eef2ff' : '#fff',
                        color: form.urgencia === u.value ? '#4f46e5' : '#374151',
                        fontSize: 13, textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{u.emoji}</div>
                      <div style={{ fontWeight: 600, marginTop: 4 }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{u.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Descripción */}
          {step === 2 && (
            <div>
              <label className="label">Contanos tu situación *</label>
              <textarea
                className="input"
                placeholder="Describí brevemente tu situación o consulta. Cuanto más detalle, mejor podremos ayudarte..."
                value={form.mensaje}
                onChange={(e) => set('mensaje')(e.target.value)}
                autoFocus
                rows={7}
                style={{ resize: 'vertical', minHeight: 140 }}
              />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {form.mensaje.length} caracteres{form.mensaje.length > 0 && form.mensaje.length < 20 ? ' — mínimo 20' : ''}
              </div>
            </div>
          )}

          {/* Step 3: Datos + resumen */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#f7f7fb', borderRadius: 8, padding: '14px 16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 4 }}>Resumen</div>
                <div><strong>Tipo:</strong> {form.tipo_caso}</div>
                <div><strong>Urgencia:</strong> {urgSelected?.emoji} {urgSelected?.label}</div>
                <div style={{ color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Consulta:</strong>{' '}
                  {form.mensaje.length > 100 ? form.mensaje.slice(0, 100) + '…' : form.mensaje}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nombre completo *</label>
                  <input
                    className="input"
                    placeholder="Ej: María García"
                    value={form.nombre_cliente}
                    onChange={(e) => set('nombre_cliente')(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => set('email')(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    className="input"
                    placeholder="11 1234-5678"
                    value={form.telefono}
                    onChange={(e) => set('telefono')(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Agenda Directa (opcional) */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Opcional — seleccioná una fecha y horario de preferencia para ser contactado.
              </p>

              <div>
                <label className="label">Fecha preferida</label>
                <input
                  className="input"
                  type="date"
                  value={form.fecha_preferida}
                  onChange={(e) =>
                    setForm(f => ({ ...f, fecha_preferida: e.target.value, horario_preferido: '' }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                  style={{ maxWidth: 220 }}
                />
              </div>

              {form.fecha_preferida && (
                <div>
                  <label className="label">Horario preferido</label>
                  {loadingSlots ? (
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>Verificando disponibilidad...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8 }}>
                      {HORARIOS.map((h) => {
                        const ocupado = ocupados.includes(h);
                        const seleccionado = form.horario_preferido === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={ocupado}
                            onClick={() => set('horario_preferido')(h)}
                            style={{
                              padding: '10px 6px', borderRadius: 8, textAlign: 'center',
                              cursor: ocupado ? 'not-allowed' : 'pointer',
                              border: `2px solid ${seleccionado ? '#4f46e5' : ocupado ? '#f0f0f0' : '#e5e7eb'}`,
                              background: seleccionado ? '#eef2ff' : ocupado ? '#f9fafb' : '#fff',
                              color: seleccionado ? '#4f46e5' : ocupado ? '#d1d5db' : '#374151',
                              fontSize: 13, fontWeight: seleccionado ? 600 : 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            <div>{h}</div>
                            {ocupado && <div style={{ fontSize: 9, marginTop: 3, color: '#d1d5db' }}>No disp.</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(form.fecha_preferida || form.horario_preferido) && (
                <div style={{ background: '#f7f7fb', borderRadius: 8, padding: '14px 16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 4 }}>Resumen</div>
                  <div><strong>Tipo:</strong> {form.tipo_caso}</div>
                  <div><strong>Urgencia:</strong> {urgSelected?.emoji} {urgSelected?.label}</div>
                  {form.fecha_preferida && (
                    <div>
                      <strong>Fecha:</strong>{' '}
                      {new Date(form.fecha_preferida + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  )}
                  {form.horario_preferido && <div><strong>Horario:</strong> {form.horario_preferido} hs</div>}
                </div>
              )}

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="btn-ghost"
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              ← Anterior
            </button>

            {step === 1 && (
              <button type="button" onClick={() => setStep(2)} className="btn-primary"
                disabled={!canProceedStep1} style={{ opacity: !canProceedStep1 ? 0.5 : 1 }}>
                Siguiente →
              </button>
            )}
            {step === 2 && (
              <button type="button" onClick={() => setStep(3)} className="btn-primary"
                disabled={!canProceedStep2} style={{ opacity: !canProceedStep2 ? 0.5 : 1 }}>
                Siguiente →
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={() => setStep(4)} className="btn-primary"
                disabled={!canProceedStep3} style={{ opacity: !canProceedStep3 ? 0.5 : 1 }}>
                Siguiente →
              </button>
            )}
            {step === 4 && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={enviando}
                  onClick={() => submitForm({ ...form, fecha_preferida: '', horario_preferido: '' })}
                >
                  Omitir
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={enviando}
                  style={{ padding: '13px 28px', fontSize: 15 }}
                  onClick={() => submitForm(form)}
                >
                  {enviando ? 'Enviando...' : 'Confirmar consulta →'}
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '16px 0 0' }}>
          Tu información es confidencial y no será compartida con terceros.
        </p>
      </div>
    </div>
  );
}
