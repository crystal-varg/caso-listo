'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      // The backend always returns the same response whether the email exists
      // or not — UI mirrors that contract.
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el enlace. Intentá de nuevo.');
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
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 15 }}>Restablecé tu contraseña</p>
        </div>

        <div className="card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '12px 4px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 10px' }}>
                Revisá tu correo
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Si <strong>{email}</strong> está registrado, te enviamos un enlace
                para restablecer tu contraseña. El enlace expira en 1 hora.
              </p>
              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
                Si no llega en unos minutos, revisá la carpeta de spam o probá de nuevo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Ingresá el email de tu cuenta y te mandamos un enlace para elegir una nueva contraseña.
              </p>

              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  maxLength={254}
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
                disabled={loading}
                style={{ padding: '12px', fontSize: 15, marginTop: 4 }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
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
