'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { TEMPLATE_REGISTRY, DEFAULT_TEMPLATE_ID } from '@/templates/registry';

interface Servicio {
  titulo: string;
  descripcion: string;
  nombre_corto?: string;
}

interface Credencial {
  label: string;
  value: string;
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
  template_id?: string;
  sobre_nosotros?: {
    año_fundacion?: string;
    stat_numero?: string;
    stat_label?: string;
    texto_principal?: string;
    descripcion_1?: string;
    descripcion_2?: string;
    credenciales?: Credencial[];
  };
  redes?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  hero?: {
    tagline?: string;
    eyebrow?: string;
    cta_primario?: string;
    cta_secundario?: string;
  };
  trust?: {
    matricula?: string;
    entidad?: string;
    numero_sindico?: string;
    badges?: string[];
  };
  contacto_config?: {
    tiempo_respuesta?: string;
    mensaje_whatsapp?: string;
    mostrar_horarios?: boolean;
    horarios?: string;
  };
  mobile?: {
    cta_flotante?: boolean;
    cta_texto?: string;
  };
}

interface Props {
  initialData?: EstudioConfigData | null;
  slug?: string;
  modo: 'crear' | 'editar';
}

const DEFAULT_AREAS = ['Civil / Comercial', 'Laboral', 'Penal', 'Familia', 'Sin definir'];

const SUGGESTED_BADGES = [
  'Atención personalizada',
  'Reserva profesional',
  '40+ años de trayectoria',
  'Respuesta en 24hs',
];

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

  // Template
  const [templateId, setTemplateId] = useState<string>(cfg.template_id ?? DEFAULT_TEMPLATE_ID);

  // Sobre nosotros
  const [snAñoFundacion, setSnAñoFundacion] = useState(cfg.sobre_nosotros?.año_fundacion ?? '');
  const [snStatNumero, setSnStatNumero] = useState(cfg.sobre_nosotros?.stat_numero ?? '');
  const [snStatLabel, setSnStatLabel] = useState(cfg.sobre_nosotros?.stat_label ?? '');
  const [snTextoPrincipal, setSnTextoPrincipal] = useState(cfg.sobre_nosotros?.texto_principal ?? '');
  const [snDescripcion1, setSnDescripcion1] = useState(cfg.sobre_nosotros?.descripcion_1 ?? '');
  const [snDescripcion2, setSnDescripcion2] = useState(cfg.sobre_nosotros?.descripcion_2 ?? '');
  const [credenciales, setCredenciales] = useState<Credencial[]>(
    Array.isArray(cfg.sobre_nosotros?.credenciales) ? (cfg.sobre_nosotros!.credenciales as Credencial[]) : [],
  );

  // Redes sociales
  const [redFacebook, setRedFacebook] = useState(cfg.redes?.facebook ?? '');
  const [redInstagram, setRedInstagram] = useState(cfg.redes?.instagram ?? '');
  const [redLinkedin, setRedLinkedin] = useState(cfg.redes?.linkedin ?? '');

  // Hero (Propuesta de Valor)
  const [heroTagline, setHeroTagline] = useState(cfg.hero?.tagline ?? '');
  const [heroEyebrow, setHeroEyebrow] = useState(cfg.hero?.eyebrow ?? '');
  const [heroCtaPrimario, setHeroCtaPrimario] = useState(cfg.hero?.cta_primario ?? '');
  const [heroCtaSecundario, setHeroCtaSecundario] = useState(cfg.hero?.cta_secundario ?? '');

  // Trust (Credenciales Profesionales)
  const [trustMatricula, setTrustMatricula] = useState(cfg.trust?.matricula ?? '');
  const [trustEntidad, setTrustEntidad] = useState(cfg.trust?.entidad ?? '');
  const [trustNumeroSindico, setTrustNumeroSindico] = useState(cfg.trust?.numero_sindico ?? '');
  const [trustBadges, setTrustBadges] = useState<string[]>(
    Array.isArray(cfg.trust?.badges) ? (cfg.trust!.badges as string[]) : [],
  );
  const [nuevaTrustBadge, setNuevaTrustBadge] = useState('');

  // Contacto config
  const [ccTiempoRespuesta, setCcTiempoRespuesta] = useState(cfg.contacto_config?.tiempo_respuesta ?? '');
  const [ccMensajeWhatsapp, setCcMensajeWhatsapp] = useState(cfg.contacto_config?.mensaje_whatsapp ?? '');
  const [ccMostrarHorarios, setCcMostrarHorarios] = useState<boolean>(cfg.contacto_config?.mostrar_horarios ?? false);
  const [ccHorarios, setCcHorarios] = useState(cfg.contacto_config?.horarios ?? '');

  // Mobile
  const [mobCtaFlotante, setMobCtaFlotante] = useState<boolean>(cfg.mobile?.cta_flotante ?? true);
  const [mobCtaTexto, setMobCtaTexto] = useState(cfg.mobile?.cta_texto ?? '');

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

  const addCredencial = () =>
    setCredenciales([...credenciales, { label: '', value: '' }]);

  const updateCredencial = (i: number, patch: Partial<Credencial>) =>
    setCredenciales(credenciales.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const removeCredencial = (i: number) =>
    setCredenciales(credenciales.filter((_, idx) => idx !== i));

  const addBadge = () => {
    const val = nuevaTrustBadge.trim();
    if (!val) return;
    if (trustBadges.includes(val)) { setNuevaTrustBadge(''); return; }
    setTrustBadges([...trustBadges, val]);
    setNuevaTrustBadge('');
  };
  const addBadgeFromSuggestion = (s: string) => {
    if (trustBadges.includes(s)) return;
    setTrustBadges([...trustBadges, s]);
  };
  const removeBadge = (b: string) => setTrustBadges(trustBadges.filter((x) => x !== b));

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
      .map((s) => {
        const titulo = s.titulo.trim();
        const descripcion = s.descripcion.trim();
        const nombre_corto = s.nombre_corto?.trim();
        return {
          titulo,
          descripcion,
          ...(nombre_corto ? { nombre_corto } : {}),
        };
      })
      .filter((s) => s.titulo.length > 0),
    seo: {
      titulo: seoTitulo.trim(),
      descripcion: seoDescripcion.trim(),
      keywords,
    },
    template_id: templateId || DEFAULT_TEMPLATE_ID,
    sobre_nosotros: {
      año_fundacion: snAñoFundacion.trim() || undefined,
      stat_numero: snStatNumero.trim() || undefined,
      stat_label: snStatLabel.trim() || undefined,
      texto_principal: snTextoPrincipal.trim() || undefined,
      descripcion_1: snDescripcion1.trim() || undefined,
      descripcion_2: snDescripcion2.trim() || undefined,
      credenciales: credenciales
        .map((c) => ({ label: c.label.trim(), value: c.value.trim() }))
        .filter((c) => c.label.length > 0 && c.value.length > 0),
    },
    redes: {
      facebook: redFacebook.trim() || undefined,
      instagram: redInstagram.trim() || undefined,
      linkedin: redLinkedin.trim() || undefined,
    },
    hero: {
      tagline: heroTagline.trim() || undefined,
      eyebrow: heroEyebrow.trim() || undefined,
      cta_primario: heroCtaPrimario.trim() || undefined,
      cta_secundario: heroCtaSecundario.trim() || undefined,
    },
    trust: {
      matricula: trustMatricula.trim() || undefined,
      entidad: trustEntidad.trim() || undefined,
      numero_sindico: trustNumeroSindico.trim() || undefined,
      badges: trustBadges.length > 0 ? trustBadges : undefined,
    },
    contacto_config: {
      tiempo_respuesta: ccTiempoRespuesta.trim() || undefined,
      mensaje_whatsapp: ccMensajeWhatsapp.trim() || undefined,
      mostrar_horarios: ccMostrarHorarios || undefined,
      horarios: ccHorarios.trim() || undefined,
    },
    mobile: {
      cta_flotante: mobCtaFlotante,
      cta_texto: mobCtaTexto.trim() || undefined,
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

      {/* Propuesta de Valor — primera sección porque alimenta el hero del landing */}
      <section style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 22 }}>
        <h2 style={sectionTitleStyle}>Propuesta de Valor</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Tagline del estudio *</label>
            <input
              className="input"
              value={heroTagline}
              onChange={(e) => setHeroTagline(e.target.value)}
              placeholder="Ej: Contabilidad, impuestos y derecho para empresas y personas en Resistencia, Chaco"
            />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Esta frase aparece en el hero del sitio. Debe responder: ¿qué resuelvo y para quién?
            </span>
          </div>
          <div>
            <label className="label">Texto eyebrow (sobre el título)</label>
            <input
              className="input"
              value={heroEyebrow}
              onChange={(e) => setHeroEyebrow(e.target.value)}
              placeholder="Ej: Resistencia, Chaco · Desde 1985"
            />
          </div>
          <div>
            <label className="label">Botón principal</label>
            <input
              className="input"
              value={heroCtaPrimario}
              onChange={(e) => setHeroCtaPrimario(e.target.value)}
              placeholder="Ver Servicios (default)"
            />
          </div>
          <div>
            <label className="label">Botón secundario</label>
            <input
              className="input"
              value={heroCtaSecundario}
              onChange={(e) => setHeroCtaSecundario(e.target.value)}
              placeholder="Contactar (default)"
            />
          </div>
        </div>
      </section>

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

      {/* Configuración del Contacto */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Configuración del Contacto</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Tiempo de respuesta</label>
            <input
              className="input"
              value={ccTiempoRespuesta}
              onChange={(e) => setCcTiempoRespuesta(e.target.value)}
              placeholder="Ej: Le respondemos en menos de 24hs hábiles"
            />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Se muestra debajo del botón de envío del formulario de contacto.
            </span>
          </div>
          <div>
            <label className="label">Mensaje pre-cargado de WhatsApp</label>
            <input
              className="input"
              value={ccMensajeWhatsapp}
              onChange={(e) => setCcMensajeWhatsapp(e.target.value)}
              placeholder="Ej: Hola, los contacto desde su web para una consulta."
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ccMostrarHorarios}
                onChange={(e) => setCcMostrarHorarios(e.target.checked)}
              />
              <span className="label" style={{ marginBottom: 0 }}>¿Mostrar horarios de atención?</span>
            </label>
          </div>
          {ccMostrarHorarios && (
            <div>
              <label className="label">Horarios</label>
              <input
                className="input"
                value={ccHorarios}
                onChange={(e) => setCcHorarios(e.target.value)}
                placeholder="Ej: Lunes a Viernes de 8:00 a 18:00hs"
              />
            </div>
          )}
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
        {servicios.map((s, i) => {
          const ncLen = s.nombre_corto?.length ?? 0;
          return (
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
              <label className="label" style={{ marginTop: 8 }}>
                Nombre corto (para tabs){' '}
                <span style={{ fontSize: 11, color: ncLen > 12 ? '#dc2626' : '#9ca3af', fontWeight: 400 }}>
                  {ncLen}/15
                </span>
              </label>
              <input
                className="input"
                placeholder="Ej: Impositivo (max 15 caracteres)"
                value={s.nombre_corto ?? ''}
                onChange={(e) => updateServicio(i, { nombre_corto: e.target.value })}
                maxLength={15}
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
          );
        })}
        <button type="button" className="btn-ghost" onClick={addServicio} style={{ fontSize: 13 }}>
          + Agregar servicio
        </button>
      </section>

      {/* Mobile */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Mobile</h2>
        <div style={fieldsCol}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mobCtaFlotante}
                onChange={(e) => setMobCtaFlotante(e.target.checked)}
              />
              <span className="label" style={{ marginBottom: 0 }}>Botón flotante de WhatsApp</span>
            </label>
            <span style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginTop: 4 }}>
              Muestra un botón fijo en la parte inferior de la pantalla en celulares. Usa el número de WhatsApp configurado arriba.
            </span>
          </div>
          {mobCtaFlotante && (
            <div>
              <label className="label">Texto del botón flotante</label>
              <input
                className="input"
                value={mobCtaTexto}
                onChange={(e) => setMobCtaTexto(e.target.value)}
                placeholder="Consultar por WhatsApp (default)"
              />
            </div>
          )}
        </div>
      </section>

      {/* Template del sitio */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Template del sitio</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {Object.values(TEMPLATE_REGISTRY).map((t) => {
            const selected = templateId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTemplateId(t.id); } }}
                style={{
                  border: selected ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: 12,
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'border 0.1s',
                }}
              >
                <div style={{
                  height: 96,
                  borderRadius: 8,
                  background: t.preview_bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <span style={{
                    color: '#d4af37',
                    fontFamily: 'serif',
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                  }}>
                    {t.preview_text}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{t.nombre}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.45 }}>
                  {t.descripcion}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiénes Somos */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Quiénes Somos</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Año de fundación</label>
            <input
              className="input"
              value={snAñoFundacion}
              onChange={(e) => setSnAñoFundacion(e.target.value)}
              placeholder="1984"
            />
          </div>
          <div>
            <label className="label">Estadística — número</label>
            <input
              className="input"
              value={snStatNumero}
              onChange={(e) => setSnStatNumero(e.target.value)}
              placeholder="40+"
            />
          </div>
          <div>
            <label className="label">Estadística — descripción</label>
            <input
              className="input"
              value={snStatLabel}
              onChange={(e) => setSnStatLabel(e.target.value)}
              placeholder="Años de ejercicio profesional"
            />
          </div>
          <div>
            <label className="label">Texto principal</label>
            <textarea
              className="input"
              value={snTextoPrincipal}
              onChange={(e) => setSnTextoPrincipal(e.target.value)}
              rows={2}
              placeholder='"Nos dedicamos a que Usted se enfoque en lo que más sabe."'
            />
          </div>
          <div>
            <label className="label">Descripción — párrafo 1</label>
            <textarea
              className="input"
              value={snDescripcion1}
              onChange={(e) => setSnDescripcion1(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="label">Descripción — párrafo 2</label>
            <textarea
              className="input"
              value={snDescripcion2}
              onChange={(e) => setSnDescripcion2(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="label">Credenciales</label>
            {credenciales.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="input"
                  placeholder="Label (ej: Universidad)"
                  value={c.label}
                  onChange={(e) => updateCredencial(i, { label: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  className="input"
                  placeholder="Valor (ej: UNNE — 1984)"
                  value={c.value}
                  onChange={(e) => updateCredencial(i, { value: e.target.value })}
                  style={{ flex: 2 }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeCredencial(i)}
                  style={{ color: '#dc2626', fontSize: 14, padding: '0 12px' }}
                  aria-label="Eliminar credencial"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addCredencial} style={{ fontSize: 13 }}>
              + Agregar credencial
            </button>
          </div>
        </div>
      </section>

      {/* Credenciales Profesionales */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Credenciales Profesionales</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Matrícula profesional</label>
            <input
              className="input"
              value={trustMatricula}
              onChange={(e) => setTrustMatricula(e.target.value)}
              placeholder="Ej: T° 1 F° 234 CPCE Chaco"
            />
          </div>
          <div>
            <label className="label">Entidad colegiadora</label>
            <input
              className="input"
              value={trustEntidad}
              onChange={(e) => setTrustEntidad(e.target.value)}
              placeholder="Ej: FACPCE · CPCE Chaco · Colegio de Abogados de Chaco"
            />
          </div>
          <div>
            <label className="label">Nº Síndico Concursal (opcional)</label>
            <input
              className="input"
              value={trustNumeroSindico}
              onChange={(e) => setTrustNumeroSindico(e.target.value)}
              placeholder="Solo si corresponde"
            />
          </div>
          <div>
            <label className="label">Badges de confianza</label>
            <div>
              {trustBadges.length === 0 && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Aún no agregaste badges.</span>
              )}
              {trustBadges.map((b) => (
                <span
                  key={b}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#faeeda', color: '#633806', padding: '3px 10px', borderRadius: 20,
                    fontSize: 13, margin: '0 4px 4px 0',
                  }}
                >
                  {b}
                  <button
                    type="button"
                    onClick={() => removeBadge(b)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#633806', fontSize: 16, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="input"
                value={nuevaTrustBadge}
                onChange={(e) => setNuevaTrustBadge(e.target.value)}
                placeholder="Ej: 40+ años de trayectoria"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBadge(); } }}
              />
              <button type="button" className="btn-ghost" onClick={addBadge} style={{ fontSize: 13 }}>
                Agregar
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 6, display: 'block', marginBottom: 6 }}>
                Sugeridos:
              </span>
              {SUGGESTED_BADGES.map((s) => {
                const already = trustBadges.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addBadgeFromSuggestion(s)}
                    disabled={already}
                    style={{
                      fontSize: 12,
                      background: already ? '#f3f4f6' : '#fff',
                      border: '1px dashed #e5e7eb',
                      color: already ? '#9ca3af' : '#374151',
                      padding: '3px 10px', borderRadius: 20,
                      margin: '0 4px 4px 0',
                      cursor: already ? 'default' : 'pointer',
                    }}
                  >
                    + {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Redes Sociales */}
      <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22 }}>
        <h2 style={sectionTitleStyle}>Redes Sociales</h2>
        <div style={fieldsCol}>
          <div>
            <label className="label">Facebook URL</label>
            <input
              className="input"
              value={redFacebook}
              onChange={(e) => setRedFacebook(e.target.value)}
              placeholder="https://www.facebook.com/tu-estudio"
            />
          </div>
          <div>
            <label className="label">Instagram URL</label>
            <input
              className="input"
              value={redInstagram}
              onChange={(e) => setRedInstagram(e.target.value)}
              placeholder="https://www.instagram.com/tu-estudio"
            />
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input
              className="input"
              value={redLinkedin}
              onChange={(e) => setRedLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/company/tu-estudio"
            />
          </div>
        </div>
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
