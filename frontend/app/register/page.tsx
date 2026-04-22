'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    nombre_estudio: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7fb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>
              Caso<span style={{ color: '#4f46e5' }}>Listo</span>
            </div>
          </Link>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 15 }}>Creá tu cuenta en 30 segundos</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Tu nombre</label>
              <input className="input" placeholder="Ej: Martín González" value={form.nombre} onChange={set('nombre')} required autoFocus />
            </div>
            <div>
              <label className="label">Nombre del estudio</label>
              <input className="input" placeholder="Ej: Estudio González & Asociados" value={form.nombre_estudio} onChange={set('nombre_estudio')} required />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Se usará en tu formulario público de consultas</p>
            </div>
            <div>
              <label className="label">Email profesional</label>
              <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '12px', fontSize: 15, marginTop: 4 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
            </button>

            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Al registrarte aceptás los términos de uso del servicio.
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            Ingresá aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
