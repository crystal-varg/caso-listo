interface LogoProps {
  /** Rendered height in px. Width is derived from the SVG's aspect ratio. */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Brand logo. Renders `/logo.svg` from the public folder.
 *
 * Plain <img> rather than next/image because the file is a static SVG —
 * Next.js's image optimization pipeline doesn't add value here and Image
 * would force callers to specify both width and height.
 */
export default function Logo({
  height = 32,
  className,
  style,
  alt = 'CasoListo',
}: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={alt}
      className={className}
      style={{ height, width: 'auto', display: 'inline-block', ...style }}
    />
  );
}
