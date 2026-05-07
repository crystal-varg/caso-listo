'use client';
import { TemplateProps } from './registry';

export default function DarkLuxuryTemplate({ config }: TemplateProps) {
  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#f5f2ee',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p>Template: {config.nombre_completo}</p>
    </div>
  );
}
