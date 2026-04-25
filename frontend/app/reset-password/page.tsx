'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Mirror the backend's token shape gate: 64-char lowercase hex.
  // We don't use it as a security control — the backend validates — but it
  // gives the user immediate feedback if the URL was truncated by their email
  // client.
  const tokenLooksValid = /^[a-f0-9]{64}$/.test(token);

  useEffect(() => {
    if (!token) setError('Falta el token de recuperación en la URL.');
    else if (!tokenLooksValid) setError('El enlace de recuperación es inválido o está incompleto.');
  }, [token, tokenLooksValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tokenLooksValid) {
      setError('El enlace de recuperación es inválido o está incompleto.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      setError('La contraseña debe contener al menos una letra y un número.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      // Send the user to login after a short pause so they read the success message.
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña. El enlace pudo haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7fb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>
              Caso<span style={{ color: '#4f46e5' }}>Listo</span>
            </div>
          </Link>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 15 }}>Elegí una nueva contraseña</p>
        </div>

        <div className="card">
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 4px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 10px' }}>
                Contraseña actualizada
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Te estamos llevando al inicio de sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="label">Nueva contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  Al menos 8 caracteres, una letra y un número.
                </p>
              </div>

              <div>
                <label className="label">Confirmar contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repetí la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  {error}
                </div>
              )}

              <button
                className="btn-primary"
                type="submit"
                disabled={loading || !tokenLooksValid}
                style={{ padding: '12px', fontSize: 15, marginTop: 4 }}
              >
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams must be inside Suspense in Next.js App Router.
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 15 }}>Cargando...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
