import { headers } from 'next/headers';

// Refleja la interfaz EstudioConfig del backend
export interface SobreNosotros {
  año_fundacion?: string;
  stat_numero?: string;
  stat_label?: string;
  texto_principal?: string;
  descripcion_1?: string;
  descripcion_2?: string;
  credenciales?: Array<{ label: string; value: string }>;
}

export interface TenantConfig {
  nombre_completo: string;
  descripcion?: string;
  color_primary?: string;
  color_secondary?: string;
  logo_url?: string;
  whatsapp?: string;
  email_contacto?: string;
  direccion?: string;
  areas?: string[];
  servicios?: Array<{ titulo: string; descripcion: string }>;
  seo?: { titulo?: string; descripcion?: string; keywords?: string[] };
  template_id?: string;
  sobre_nosotros?: SobreNosotros;
  redes?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface TenantData {
  slug: string;
  nombre_estudio: string;
  config: TenantConfig;
}

// Lee el slug del tenant desde el header seteado por el middleware
export async function getTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-tenant-slug');
}

// Fetch de config del tenant desde el backend.
// Server-side: pega directo al backend (no el proxy /api de same-origin).
export async function fetchTenantData(slug: string): Promise<TenantData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/estudios/publico/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
