'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface ConsultaForm {
  nombre_cliente: string;
  email: string;
  telefono: string;
  mensaje: string;
  urgencia: string;
  tipo_caso: string;
  fecha_preferida: string;
  horario_preferido: string;
}

interface DocState {
  estado: 'pendiente' | 'subido' | 'faltante';
  file?: File;
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

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_MB = 20;

function generateSlots(startHour = 7, endHour = 22): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'am' : 'pm';
      slots.push(`${h12}:${m === 0 ? '00' : m}${ampm}`);
    }
  }
  return slots;
}

const HORARIOS = generateSlots();

const STEPS = [
  { number: 1, title: 'Tipo' },
  { number: 2, title: 'Detalle' },
  { number: 3, title: 'Datos' },
  { number: 4, title: 'Agenda' },
  { number: 5, title: 'Documentos' },
];

export default function ConsultaPublicaPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ConsultaForm>({
    nombre_cliente: '', email: '', telefono: '', mensaje: '',
    urgencia: 'media', tipo_caso: '', fecha_preferida: '', horario_preferido: '',
  });
  const [docs, setDocs] = useState<{ dni: DocState; relacionado: DocState }>({
    dni: { estado: 'pendiente' },
    relacionado: { estado: 'pendiente' },
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dniInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ConsultaForm>(k: K) => (val: string) =>
    setForm(f => ({ ...f, [k]: val }));

  useEffect(() => {
    if (!form.fecha_preferida || step !== 4) return;
    setLoadingSlots(true);
    setOcupados([]);
    fetch(`${API_URL}/consultas/publica/${slug}/disponibilidad?fecha=${form.fecha_preferida}`)
      .then(r => r.json())
      .then(data => setOcupados(data.ocupados ?? []))
      .catch(() => setOcupados([]))
      .finally(() => setLoadingSlots(false));
  }, [form.fecha_preferida, step, slug]);

  const canProceedStep1 = form.tipo_caso !== '';
  const canProceedStep2 = form.mensaje.trim().length >= 20;
  const canProceedStep3 = form.nombre_cliente.trim() !== '' && form.email.trim() !== '';

  const docsCompletados = [docs.dni, docs.relacionado].filter(
    d => d.estado !== 'pendiente',
  ).length;

  const handleFileChange = (key: 'dni' | 'relacionado', file: File | null) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB}MB.`);
      return;
    }
    setError('');
    setDocs(d => ({ ...d, [key]: { estado: 'subido', file } }));
  };

  const submitForm = async (data: ConsultaForm) => {
    setError('');
    setEnviando(true);
    try {
      const fd = new FormData();
      (Object.keys(data) as (keyof ConsultaForm)[]).forEach(k => {
        if (data[k]) fd.append(k, data[k]);
      });
      fd.append('dni_estado', docs.dni.estado);
      fd.append('docs_estado', docs.relacionado.estado);
      if (docs.dni.file) fd.append('dni_archivo', docs.dni.file);
      if (docs.relacionado.file) fd.append('docs_archivo', docs.relacionado.file);

      const res = await fetch(`${API_URL}/consultas/publica/${slug}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(err.message || `Error ${res.status}`);
      }
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
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
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
                  height: 2, flex: 1, marginTop: 14,
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

          {/* ── Step 1: Tipo + urgencia ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label className="label">¿Qué tipo de consulta tenés?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  {TIPOS_CASO.map((tipo) => (
                    <button key={tipo} type="button" onClick={() => set('tipo_caso')(tipo)}
                      style={{
                        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.tipo_caso === tipo ? '#4f46e5' : '#e5e7eb'}`,
                        background: form.tipo_caso === tipo ? '#eef2ff' : '#fff',
                        color: form.tipo_caso === tipo ? '#4f46e5' : '#374151',
                        fontWeight: form.tipo_caso === tipo ? 600 : 400,
                        fontSize: 14, textAlign: 'left', transition: 'all 0.15s',
                      }}>
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Urgencia</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                  {URGENCIAS.map((u) => (
                    <button key={u.value} type="button" onClick={() => set('urgencia')(u.value)}
                      style={{
                        padding: '12px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.urgencia === u.value ? '#4f46e5' : '#e5e7eb'}`,
                        background: form.urgencia === u.value ? '#eef2ff' : '#fff',
                        color: form.urgencia === u.value ? '#4f46e5' : '#374151',
                        fontSize: 13, textAlign: 'center', transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: 18 }}>{u.emoji}</div>
                      <div style={{ fontWeight: 600, marginTop: 4 }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{u.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Descripción ── */}
          {step === 2 && (
            <div>
              <label className="label">Contanos tu situación *</label>
              <textarea className="input"
                placeholder="Describí brevemente tu situación o consulta. Cuanto más detalle, mejor podremos ayudarte..."
                value={form.mensaje}
                onChange={(e) => set('mensaje')(e.target.value)}
                autoFocus rows={7}
                style={{ resize: 'vertical', minHeight: 140 }}
              />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {form.mensaje.length} caracteres{form.mensaje.length > 0 && form.mensaje.length < 20 ? ' — mínimo 20' : ''}
              </div>
            </div>
          )}

          {/* ── Step 3: Datos + resumen ── */}
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
                  <input className="input" placeholder="Ej: María García" value={form.nombre_cliente}
                    onChange={(e) => set('nombre_cliente')(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" placeholder="tu@email.com" value={form.email}
                    onChange={(e) => set('email')(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input" placeholder="11 1234-5678" value={form.telefono}
                    onChange={(e) => set('telefono')(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Agenda Directa (opcional) ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Opcional — seleccioná una fecha y horario de preferencia para ser contactado.
              </p>
              <div>
                <label className="label">Fecha preferida</label>
                <input className="input" type="date" value={form.fecha_preferida}
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
                    <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, marginTop: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {HORARIOS.map((h) => {
                          const ocupado = ocupados.includes(h);
                          const seleccionado = form.horario_preferido === h;
                          return (
                            <button key={h} type="button" disabled={ocupado}
                              onClick={() => set('horario_preferido')(h)}
                              style={{
                                padding: '8px 4px', borderRadius: 6, textAlign: 'center',
                                cursor: ocupado ? 'not-allowed' : 'pointer',
                                border: `2px solid ${seleccionado ? '#4f46e5' : ocupado ? '#f0f0f0' : '#e5e7eb'}`,
                                background: seleccionado ? '#eef2ff' : ocupado ? '#f9fafb' : '#fff',
                                color: seleccionado ? '#4f46e5' : ocupado ? '#d1d5db' : '#374151',
                                fontSize: 12, fontWeight: seleccionado ? 600 : 400, lineHeight: 1.2,
                              }}>
                              {h}
                              {ocupado && <div style={{ fontSize: 9, marginTop: 2, color: '#d1d5db' }}>No disp.</div>}
                            </button>
                          );
                        })}
                      </div>
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
                    <div><strong>Fecha:</strong> {new Date(form.fecha_preferida + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  )}
                  {form.horario_preferido && <div><strong>Horario:</strong> {form.horario_preferido} hs</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Documentación ── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    {docsCompletados}/2 completados
                  </span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Opcional</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.3s',
                    background: docsCompletados === 2 ? '#16a34a' : '#4f46e5',
                    width: `${(docsCompletados / 2) * 100}%`,
                  }} />
                </div>
              </div>

              {/* DNI Block */}
              <DocBlock
                label="DNI"
                description="Documento personal"
                estado={docs.dni.estado}
                fileName={docs.dni.file?.name}
                inputRef={dniInputRef}
                accept={ACCEPT}
                onFileChange={(f) => handleFileChange('dni', f)}
                onFaltante={() => setDocs(d => ({ ...d, dni: { estado: 'faltante' } }))}
                onEliminar={() => {
                  setDocs(d => ({ ...d, dni: { estado: 'pendiente' } }));
                  if (dniInputRef.current) dniInputRef.current.value = '';
                }}
              />

              {/* Documentación relacionada Block */}
              <DocBlock
                label="Documentación relacionada"
                description="Documentos del caso"
                estado={docs.relacionado.estado}
                fileName={docs.relacionado.file?.name}
                inputRef={docsInputRef}
                accept={ACCEPT}
                onFileChange={(f) => handleFileChange('relacionado', f)}
                onFaltante={() => setDocs(d => ({ ...d, relacionado: { estado: 'faltante' } }))}
                onEliminar={() => {
                  setDocs(d => ({ ...d, relacionado: { estado: 'pendiente' } }));
                  if (docsInputRef.current) docsInputRef.current.value = '';
                }}
              />

              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                Formatos permitidos: PDF, JPG, PNG, DOC, DOCX · Máximo {MAX_MB}MB por archivo
              </p>

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost"
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
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
                <button type="button" className="btn-ghost"
                  onClick={() => {
                    setForm(f => ({ ...f, fecha_preferida: '', horario_preferido: '' }));
                    setStep(5);
                  }}>
                  Omitir
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep(5)}>
                  Siguiente →
                </button>
              </div>
            )}
            {step === 5 && (
              <button type="button" className="btn-primary"
                disabled={enviando}
                style={{ padding: '13px 28px', fontSize: 15 }}
                onClick={() => submitForm(form)}>
                {enviando ? 'Enviando...' : 'Guardar y continuar →'}
              </button>
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

// ── DocBlock component ──────────────────────────────────────────────────────
interface DocBlockProps {
  label: string;
  description: string;
  estado: 'pendiente' | 'subido' | 'faltante';
  fileName?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onFileChange: (file: File) => void;
  onFaltante: () => void;
  onEliminar: () => void;
}

function DocBlock({ label, description, estado, fileName, inputRef, accept, onFileChange, onFaltante, onEliminar }: DocBlockProps) {
  const estadoColor = estado === 'subido' ? '#16a34a' : estado === 'faltante' ? '#9ca3af' : '#4f46e5';
  const estadoLabel = estado === 'subido' ? 'Subido' : estado === 'faltante' ? 'No disponible' : 'Pendiente';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px' }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) onFileChange(e.target.files[0]); }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{label}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{description}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
          background: estado === 'subido' ? '#dcfce7' : estado === 'faltante' ? '#f3f4f6' : '#eef2ff',
          color: estadoColor,
        }}>
          {estadoLabel}
        </span>
      </div>

      {estado === 'pendiente' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #4f46e5', background: '#fff', color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>
            📎 Subir archivo
          </button>
          <button type="button" onClick={onFaltante}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13 }}>
            No lo tengo todavía
          </button>
        </div>
      )}

      {estado === 'subido' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8 }}>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
          </div>
          <button type="button" onClick={onEliminar}
            style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13 }}>
            Eliminar
          </button>
        </div>
      )}

      {estado === 'faltante' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, padding: '8px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#6b7280' }}>
            No disponible por ahora
          </div>
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #4f46e5', background: '#fff', color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>
            Subir
          </button>
        </div>
      )}
    </div>
  );
}
