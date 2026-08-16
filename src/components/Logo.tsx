interface LogoProps {
  size?: number;
  withGlow?: boolean;
  className?: string;
}

// Custom faceted diamond mark — not the diamond emoji. Elegant angular
// geometry with a luminous green core, used across splash, login,
// header, chat, favicon, and admin per spec section 6.
export function Logo({ size = 40, withGlow = true, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Mass Diamond"
    >
      <defs>
        <linearGradient id="md-facet-a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39FF88" />
          <stop offset="100%" stopColor="#1f8a53" />
        </linearGradient>
        <linearGradient id="md-facet-b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f8a53" />
          <stop offset="100%" stopColor="#0c1210" />
        </linearGradient>
        {withGlow && (
          <filter id="md-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={withGlow ? "url(#md-glow)" : undefined}>
        {/* top facet */}
        <path d="M50 6 L78 30 L50 42 L22 30 Z" fill="url(#md-facet-a)" />
        {/* left facet */}
        <path d="M22 30 L50 42 L38 94 L10 46 Z" fill="url(#md-facet-b)" opacity="0.9" />
        {/* right facet */}
        <path d="M78 30 L50 42 L62 94 L90 46 Z" fill="#1f8a53" opacity="0.75" />
        {/* center highlight facet */}
        <path d="M50 42 L38 94 L50 100 L62 94 Z" fill="#39FF88" opacity="0.9" />
        {/* outline for crispness at small sizes */}
        <path
          d="M50 6 L78 30 L90 46 L62 94 L50 100 L38 94 L10 46 L22 30 Z"
          fill="none"
          stroke="#39FF88"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
