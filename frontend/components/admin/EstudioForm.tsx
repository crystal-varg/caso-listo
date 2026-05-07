'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Servicio {
  titulo: string;
  descripcion: string;
}

interface EstudioConfigData {
  nombre_completo?: string;
  descripcion?: string;
  color_primary?: string;
  color_secondary?: string;
  logo_url?: string;
  whatsapp?: string;
  email_contacto?: string;
  direccion?: string;
  areas?: string[];
  servicios?: Servicio[];
  seo?: { titulo?: string; descripcion?: string; keywords?: string[] };
}

interface Props {
  initialData?: EstudioConfigData | null;
  slug?: string;
  modo: 'crear' | 'editar';
}

const DEFAULT_AREAS = ['Civil / Comercial', 'Laboral', 'Penal', 'Familia', 'Sin definir'];

export default function EstudioForm({ initialData, slug, modo }: Props) {
  const router = useRouter();
  const cfg = initialData ?? {};

  // Account (solo crear)
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Identity
  const [nombreCompleto, setNombreCompleto] = useState(cfg.nombre_completo ?? '');
  const [slugInput, setSlugInput] = useState(slug ?? '');
  const [descripcion, setDescripcion] = useState(cfg.descripcion ?? '');

  // Contact
  const [whatsapp, setWhatsapp] = useState(cfg.whatsapp ?? '');
  const [emailContacto, setEmailContacto] = useState(cfg.email_contacto ?? '');
  const [direccion, setDireccion] = useState(cfg.direccion ?? '');

  // Appearance
  const [colorPrimary, setColorPrimary] = useState(cfg.color_primary ?? '#4f46e5');
  const [colorSecondary, setColorSecondary] = useState(cfg.color_secondary ?? '#6b7280');
  const [logoUrl, setLogoUrl] = useState(cfg.logo_url ?? '');

  // Areas
  const [areas, setAreas] = useState<string[]>(
    Array.isArray(cfg.areas) && cfg.areas.length > 0 ? cfg.areas : DEFAULT_AREAS,
  );
  const [nuevaArea, setNuevaArea] = useState('');

  // Servicios
  const [servicios, setServicios] = useState<Servicio[]>(
    Array.isArray(cfg.servicios) ? cfg.servicios : [],
  );

  // SEO
  const [seoTitulo, setSeoTitulo] = useState(cfg.seo?.titulo ?? '');
  const [seoDescripcion, setSeoDescripcion] = useState(cfg.seo?.descripcion ?? '');
  const [keywords, setKeywords] = useState<string[]>(
    Array.isArray(cfg.seo?.keywords) ? (cfg.seo!.keywords as string[]) : [],
  );
  const [nuevaKeyword, setNuevaKeyword] = useState('');

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const addArea = () => {
    const val = nuevaArea.trim();
    if (!val) return;
    if (areas.includes(val)) { setNuevaArea(''); return; }
    setAreas([...areas, val]);
    setNuevaArea('');
  };

  const removeArea = (a: string) => setAreas(areas.filter((x) => x !== a));

  const addKeyword = () => {
    const val = nuevaKeyword.trim();
    if (!val) return;
    if (keywords.includes(val)) { setNuevaKeyword(''); return; }
    setKeywords([...keywords, val]);
    setNuevaKeyword('');
  };

  const removeKeyword = (k: string) => setKeywords(keywords.filter((x) => x !== k));

  const addServicio = () =>
    setServicios([...servicios, { titulo: '', descripcion: '' }]);

  const updateServicio = (i: number, patch: Partial<Servicio>) =>
    setServicios(servicios.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const removeServicio = (i: number) =>
    setServicios(servicios.filter((_, idx) => idx !== i));

  const buildConfig = () => ({
    nombre_completo: nombreCompleto.trim(),
    descripcion: descripcion.trim(),
    color_primary: colorPrimary,
    color_secondary: colorSecondary,
    logo_url: logoUrl.trim() || undefined,
    whatsapp: whatsapp.trim() || undefined,
    email_contacto: emailContacto.trim() || undefined,
    direccion: direccion.trim() || undefined,
    areas,
    servicios: servicios
      .map((s) => ({ titulo: s.titulo.trim(), descripcion: s.descripcion.trim() }))
      .filter((s) => s.titulo.length > 0),
    seo: {
      titulo: seoTitulo.trim(),
      descripcion: seoDescripcion.trim(),
      keywords,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOkMsg('');

    if (modo === 'crear') {
      if (!nombre.trim() || !email.trim() || !password) {
        setError('Completá nombre, email y contraseña.');
        return;
      }
      if (!slugInput.trim()) { setError('El slug es requerido.'); return; }
    }
    if (!nombreCompleto.trim()) { setError('El nombre completo es requerido.'); return; }

    setGuardando(true);
    try {
      const config = buildConfig();
      if (modo === 'crear') {
        await api.post('/admin/estudios', {
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          slug: slugInput.trim(),
          config,
        });
        router.push('/admin/estudios');
      } else {
        await api.put(`/admin/estudios/${slug}`, { config });
        setOkMsg('Guardado correctamente ✓');
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Cuenta — solo crear */}
      {modo === 'crear' && (
        <section style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 22 }}>
          <h2 style={sectionTitleStyle}>Cuenta</h2>
          <div style={fieldsCol}>
            <div>
              <label className="label">Nombre del titular</label>
              <input
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="estudio@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                Mínimo 8 caracteres, al menos una letra y un número.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Identidad */}
      <section>
        <h2 style={sectionTitleStyle}>Identidad del estudio</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Nombre completo / razón social</label>
            <input
              className="input"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Estudio Jurídico Pérez & Asociados"
              required
            />
          </div>
          <div>
            <label className="label">Slug (subdominio)</label>
            <input
              className="input"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="perez-asociados"
              required={modo === 'crear'}
              disabled={modo === 'editar'}
              style={modo === 'editar' ? { background: '#f9fafb', color: '#6b7280' } : undefined}
            />
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
              Sitio: <strong>{slugInput || '...'}.casolisto.com</strong>
            </p>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Bajada que aparece en la landing pública del estudio."
            />
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Contacto</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">WhatsApp</label>
            <input
              className="input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+543624769601"
            />
          </div>
          <div>
            <label className="label">Email de contacto</label>
            <input
              className="input"
              type="email"
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              placeholder="contacto@estudio.com"
            />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              className="input"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Siempreviva 742, Resistencia"
            />
          </div>
        </div>
      </section>

      {/* Apariencia */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Apariencia</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Color primario</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                style={{ width: 44, height: 36, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
              />
              <input
                className="input"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                style={{ fontFamily: 'monospace' }}
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="label">Color secundario</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                style={{ width: 44, height: 36, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
              />
              <input
                className="input"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                style={{ fontFamily: 'monospace' }}
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="label">URL del logo</label>
            <input
              className="input"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
            {logoUrl.startsWith('http') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                style={{ height: 48, marginTop: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Áreas */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Áreas de consulta</h2>
        <div>
          {areas.length === 0 && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Aún no agregaste áreas.</span>
          )}
          {areas.map((area) => (
            <span
              key={area}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 20,
                fontSize: 13, margin: '0 4px 4px 0',
              }}
            >
              {area}
              <button
                type="button"
                onClick={() => removeArea(area)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            className="input"
            value={nuevaArea}
            onChange={(e) => setNuevaArea(e.target.value)}
            placeholder="Nueva área"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
          />
          <button type="button" className="btn-ghost" onClick={addArea} style={{ fontSize: 13 }}>
            Agregar
          </button>
        </div>
      </section>

      {/* Servicios */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Servicios</h2>
        {servicios.map((s, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 8 }}>
            <input
              className="input"
              placeholder="Título del servicio"
              value={s.titulo}
              onChange={(e) => updateServicio(i, { titulo: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Descripción"
              value={s.descripcion}
              onChange={(e) => updateServicio(i, { descripcion: e.target.value })}
              rows={2}
              style={{ marginTop: 8 }}
            />
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}
              onClick={() => removeServicio(i)}
            >
              × Eliminar
            </button>
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={addServicio} style={{ fontSize: 13 }}>
          + Agregar servicio
        </button>
      </section>

      {/* SEO */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>SEO</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">
              Título SEO{' '}
              <span style={{ fontSize: 11, color: seoTitulo.length > 55 ? '#dc2626' : '#9ca3af', fontWeight: 400 }}>
                {seoTitulo.length}/60
              </span>
            </label>
            <input
              className="input"
              value={seoTitulo}
              onChange={(e) => setSeoTitulo(e.target.value)}
              placeholder="Lo que aparece en el <title> del navegador"
            />
          </div>
          <div>
            <label className="label">
              Meta descripción{' '}
              <span style={{ fontSize: 11, color: seoDescripcion.length > 155 ? '#dc2626' : '#9ca3af', fontWeight: 400 }}>
                {seoDescripcion.length}/160
              </span>
            </label>
            <textarea
              className="input"
              value={seoDescripcion}
              onChange={(e) => setSeoDescripcion(e.target.value)}
              rows={2}
              placeholder="Resumen para buscadores"
            />
          </div>
          <div>
            <label className="label">Keywords</label>
            <div>
              {keywords.length === 0 && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Sin keywords.</span>
              )}
              {keywords.map((k) => (
                <span
                  key={k}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#f3f4f6', color: '#374151', padding: '3px 10px', borderRadius: 20,
                    fontSize: 13, margin: '0 4px 4px 0',
                  }}
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => removeKeyword(k)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: 16, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="input"
                value={nuevaKeyword}
                onChange={(e) => setNuevaKeyword(e.target.value)}
                placeholder="Nueva keyword"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
              />
              <button type="button" className="btn-ghost" onClick={addKeyword} style={{ fontSize: 13 }}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}
      {okMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {okMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push('/admin/estudios')}
          disabled={guardando}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : modo === 'crear' ? 'Crear estudio' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#111',
  margin: '0 0 14px',
};

const fieldsCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};
