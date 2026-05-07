import { TenantConfig } from '@/lib/tenant';

export interface TemplateProps {
  slug: string;
  config: TenantConfig;
}

// IDs de templates disponibles
export const TEMPLATE_IDS = {
  DARK_LUXURY: 'dark-luxury',
} as const;

export type TemplateId = typeof TEMPLATE_IDS[keyof typeof TEMPLATE_IDS];

// Metadata de cada template para mostrar en el admin
export const TEMPLATE_REGISTRY: Record<string, {
  id: string;
  nombre: string;
  descripcion: string;
  preview_bg: string;
  preview_text: string;
}> = {
  'dark-luxury': {
    id: 'dark-luxury',
    nombre: 'Dark Luxury',
    descripcion: 'Fondo negro, tipografía serif, detalles dorados. Ideal para estudios premium.',
    preview_bg: 'linear-gradient(135deg, #080808 0%, #1a1510 100%)',
    preview_text: '✦ Dark Luxury',
  },
};

export const DEFAULT_TEMPLATE_ID = 'dark-luxury';
