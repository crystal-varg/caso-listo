'use client';
import EstudioForm from '@/components/admin/EstudioForm';

export default function NuevoEstudioPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 24 }}>
        Nuevo estudio
      </h1>
      <EstudioForm modo="crear" />
    </div>
  );
}
