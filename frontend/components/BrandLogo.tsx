import artwork from "@/assets/branding/soyle-artwork.json";

type BrandLogoProps = {
  variant?: "full" | "mark";
  size?: number;
  color?: string;
  decorative?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = "full",
  size = 26,
  color,
  decorative = false,
  className,
}: BrandLogoProps) {
  const { mark, word, full } = artwork;
  const lockup = variant === "full";
  const { width, height } = lockup ? full : mark;

  return (
    <svg
      className={`soyle-logo soyle-logo--${variant}${className ? ` ${className}` : ""}`}
      width={size * width / height}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMid slice"
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Söyle"}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <path d={mark.path} transform={lockup ? full.markTransform : undefined} />
      {lockup && <path className="soyle-logo-word" d={word.path} transform={full.wordTransform} />}
    </svg>
  );
}
