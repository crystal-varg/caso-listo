import type { Metadata } from 'next';
import { fetchTenantData } from '@/lib/tenant';
import DarkLuxuryTemplate from '@/templates/DarkLuxuryTemplate';
import { DEFAULT_TEMPLATE_ID } from '@/templates/registry';

interface Props {
  // Next.js 16 typing: dynamic-segment params are exposed as a Promise on
  // server components and must be awaited before reading.
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params;
  const data = await fetchTenantData(tenant);
  if (!data?.config?.seo) {
    return { title: data?.config?.nombre_completo ?? 'Caso Listo' };
  }
  return {
    title: data.config.seo.titulo,
    description: data.config.seo.descripcion,
    keywords: data.config.seo.keywords?.join(', '),
  };
}

export default async function TenantPage({ params }: Props) {
  const { tenant } = await params;
  const data = await fetchTenantData(tenant);

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#6b7280' }}>Estudio no encontrado.</p>
      </div>
    );
  }

  const templateId = data.config.template_id ?? DEFAULT_TEMPLATE_ID;

  switch (templateId) {
    case 'dark-luxury':
      return <DarkLuxuryTemplate slug={tenant} config={data.config} />;
    default:
      return <DarkLuxuryTemplate slug={tenant} config={data.config} />;
  }
}
