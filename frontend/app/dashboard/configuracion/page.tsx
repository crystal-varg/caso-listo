'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function ConfiguracionPage() {
  const { usuario, estudio, hydrate } = useAuthStore();

  // Profile form
  const [perfil, setPerfil] = useState({ nombre: '', email: '', password: '', passwordConfirm: '' });
  const [perfilError, setPerfilError] = useState('');
  const [perfilOk, setPerfilOk] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estudio form
  const [nombreEstudio, setNombreEstudio] = useState('');
  const [estudioError, setEstudioError] = useState('');
  const [estudioOk, setEstudioOk] = useState('');
  const [guardandoEstudio, setGuardandoEstudio] = useState(false);

  useEffect(() => {
    if (usuario) setPerfil((p) => ({ ...p, nombre: usuario.nombre, email: usuario.email }));
    if (estudio) setNombreEstudio(estudio.nombre_estudio);
  }, [usuario, estudio]);

  const guardarPerfil = async () => {
    setPerfilError('');
    setPerfilOk('');
    if (!perfil.nombre.trim()) { setPerfilError('El nombre es requerido.'); return; }
    if (!perfil.email.trim()) { setPerfilError('El email es requerido.'); return; }
    if (perfil.password && perfil.password !== perfil.passwordConfirm) {
      setPerfilError('Las contraseñas no coinciden.'); return;
    }
    if (perfil.password && perfil.password.length < 6) {
      setPerfilError('La contraseña debe tener al menos 6 caracteres.'); return;
    }

    setGuardandoPerfil(true);
    try {
      const body: Record<string, string> = { nombre: perfil.nombre, email: perfil.email };
      if (perfil.password) body.password = perfil.password;
      await api.patch('/auth/profile', body);
      await hydrate();
      setPerfil((p) => ({ ...p, password: '', passwordConfirm: '' }));
      setPerfilOk('Perfil actualizado correctamente.');
    } catch (err: any) {
      setPerfilError(err.message || 'Error al guardar.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const guardarEstudio = async () => {
    setEstudioError('');
    setEstudioOk('');
    if (!nombreEstudio.trim()) { setEstudioError('El nombre del estudio es requerido.'); return; }
    setGuardandoEstudio(true);
    try {
      await api.patch('/estudios/mio', { nombre_estudio: nombreEstudio.trim() });
      await hydrate();
      setEstudioOk('Estudio actualizado correctamente.');
    } catch (err: any) {
      setEstudioError(err.message || 'Error al guardar.');
    } finally {
      setGuardandoEstudio(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Configuración</h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Tu perfil y datos del estudio</p>
      </div>

      {/* Profile section */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Tu perfil</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nombre completo</label>
            <input
              className="input"
              value={perfil.nombre}
              onChange={(e) => setPerfil((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={perfil.email}
              onChange={(e) => setPerfil((p) => ({ ...p, email: e.target.value }))}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 12 }}>
              CAMBIAR CONTRASEÑA (opcional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Nueva contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={perfil.password}
                  onChange={(e) => setPerfil((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={perfil.passwordConfirm}
                  onChange={(e) => setPerfil((p) => ({ ...p, passwordConfirm: e.target.value }))}
                  placeholder="Repetir contraseña"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {perfilError && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {perfilError}
            </div>
          )}
          {perfilOk && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              ✓ {perfilOk}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={guardarPerfil}
            disabled={guardandoPerfil}
            style={{ alignSelf: 'flex-start' }}
          >
            {guardandoPerfil ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      {/* Estudio section */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Tu estudio</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nombre del estudio</label>
            <input
              className="input"
              value={nombreEstudio}
              onChange={(e) => setNombreEstudio(e.target.value)}
              placeholder="Nombre de tu estudio jurídico"
            />
          </div>

          {estudio?.slug && (
            <div>
              <label className="label">Formulario público</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={`/consulta/${estudio.slug}`}
                  target="_blank"
                  style={{ fontSize: 13, color: '#4f46e5', background: '#eef2ff', padding: '8px 12px', borderRadius: 8, textDecoration: 'none' }}
                >
                  /consulta/{estudio.slug} ↗
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/consulta/${estudio.slug}`);
                  }}
                  style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                >
                  Copiar link
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                Compartí este link con tus clientes para recibir consultas.
              </div>
            </div>
          )}

          {estudioError && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {estudioError}
            </div>
          )}
          {estudioOk && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              ✓ {estudioOk}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={guardarEstudio}
            disabled={guardandoEstudio}
            style={{ alignSelf: 'flex-start' }}
          >
            {guardandoEstudio ? 'Guardando...' : 'Guardar estudio'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fca5a5', padding: '20px 24px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', margin: '0 0 8px' }}>Zona de peligro</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
          Para eliminar tu cuenta o exportar tus datos, contactanos en soporte.
        </p>
        <a
          href="mailto:soporte@casolisto.com"
          style={{ fontSize: 13, color: '#dc2626', textDecoration: 'none' }}
        >
          Contactar soporte →
        </a>
      </div>
    </div>
  );
}
