'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import EstudioForm from '@/components/admin/EstudioForm';

interface EstudioAdmin {
  id: number;
  slug: string;
  nombre_estudio: string;
  config: any | null;
  usuario: { nombre: string; email: string } | null;
  createdAt: string;
}

export default function EditarEstudioPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [estudio, setEstudio] = useState<EstudioAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        const lista = await api.get<EstudioAdmin[]>('/admin/estudios');
        if (!active) return;
        const found = lista.find((e) => e.slug === slug) ?? null;
        setEstudio(found);
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar el estudio.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
        Cargando estudio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, maxWidth: 720 }}>
        {error}
      </div>
    );
  }

  if (!estudio) {
    return (
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>
          Estudio no encontrado
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          No existe un estudio con el slug <code>{slug}</code>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>
        {estudio.nombre_estudio}
      </h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        Editando configuración de <strong>{estudio.slug}.casolisto.com</strong>
      </p>
      <EstudioForm modo="editar" slug={estudio.slug} initialData={estudio.config} />
    </div>
  );
}
