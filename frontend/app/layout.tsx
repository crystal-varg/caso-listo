import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CasoListo — Gestión de consultas para abogados',
  description: 'Capturá, organizá y respondé consultas legales de manera profesional.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
