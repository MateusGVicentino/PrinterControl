interface ElginLogoProps {
  height?: number;
  className?: string;
  /** "brand" usa a arte oficial (azul), "white" força a marca em branco para fundos escuros/coloridos. */
  tone?: "brand" | "white";
}

export default function ElginLogo({ height = 22, className = "", tone = "brand" }: ElginLogoProps) {
  return (
    <img
      src="/logo-elgin.webp"
      alt="Elgin"
      height={height}
      style={{ height, width: "auto", filter: tone === "white" ? "brightness(0) invert(1)" : undefined }}
      className={className}
    />
  );
}
