interface LogoProps {
  size?: number;
  withGlow?: boolean;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  return (
    <img
      src="/diamond-logo.png"
      width={size}
      height={size}
      alt="Mass Diamond"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
