import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  /** Text color (semantic) */
  color: string;
  /** Background color (semantic) */
  bg: string;
  title?: string;
}

/**
 * Unified status / urgency chip used across Consultas, Casos and Honorarios.
 * One visual signature (radius, padding, font); callers only pass semantic colors.
 */
export function Badge({ children, color, bg, title }: BadgeProps) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

/** Shared urgency palette — alta = red, media = amber, baja = green. */
export const URGENCIA_CFG: Record<string, { label: string; color: string; bg: string }> = {
  alta:  { label: 'Alta',  color: '#dc2626', bg: '#fee2e2' },
  media: { label: 'Media', color: '#b45309', bg: '#fef3c7' },
  baja:  { label: 'Baja',  color: '#059669', bg: '#d1fae5' },
};
