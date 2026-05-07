import type { Metadata } from 'next';
import { getTenantSlug, fetchTenantData } from '@/lib/tenant';
import { DEFAULT_TEMPLATE_ID } from '@/templates/registry';
import DarkLuxuryTemplate from '@/templates/DarkLuxuryTemplate';

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getTenantSlug();
  if (!slug) return { title: 'Caso Listo' };
  const data = await fetchTenantData(slug);
  if (!data?.config?.seo) return { title: data?.config?.nombre_completo ?? 'Caso Listo' };
  return {
    title: data.config.seo.titulo,
    description: data.config.seo.descripcion,
    keywords: data.config.seo.keywords?.join(', '),
  };
}

export default async function LandingPage() {
  const slug = await getTenantSlug();

  // Sin tenant → landing genérica de Caso Listo
  if (!slug) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f7f7fb',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>
            Caso<span style={{ color: '#4f46e5' }}>Listo</span>
          </div>
          <p style={{ color: '#6b7280', marginTop: 12 }}>
            El sistema de gestión para estudios jurídicos y contables.
          </p>
        </div>
      </div>
    );
  }

  const data = await fetchTenantData(slug);

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#6b7280' }}>Estudio no encontrado.</p>
      </div>
    );
  }

  const templateId = data.config.template_id ?? DEFAULT_TEMPLATE_ID;

  switch (templateId) {
    case 'dark-luxury':
      return <DarkLuxuryTemplate slug={slug} config={data.config} />;
    default:
      return <DarkLuxuryTemplate slug={slug} config={data.config} />;
  }
}
