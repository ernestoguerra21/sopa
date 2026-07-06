/* Cabeza de alpaca angular (naranja) — versión vectorial del logo Alpaka ERP */
export function AlpakaHead({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Alpaka">
      <g fill="#EA5B0C">
        {/* oreja trasera */}
        <polygon points="39,32 46,4 56,14 50,31" />
        {/* oreja delantera */}
        <polygon points="55,29 67,10 73,21 62,33" />
        {/* cabeza y cuello */}
        <polygon points="37,36 59,30 72,39 84,44 87,49 84,52 75,54 69,58 64,66 62,76 62,96 28,96 32,62 34,47" />
      </g>
      {/* ojo */}
      <polygon points="54,42 66,40 61,47 51,46" fill="#fff" />
      {/* boca */}
      <polygon points="87,49 77,51 85,55" fill="#fff" />
    </svg>
  );
}

/* Marca completa: cabeza + ALPAKA + ERP */
export function AlpakaLogo({ size = 32, showText = false }: { size?: number; showText?: boolean }) {
  if (!showText) return <AlpakaHead size={size} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <AlpakaHead size={size} />
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: "0.18em",
        fontSize: `${Math.round(size * 0.32)}px`, color: "#EDEEF2", lineHeight: 1,
      }}>
        ALPAKA
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "22px", height: "2px", background: "#EA5B0C" }} />
        <span style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: "0.35em",
          fontSize: `${Math.max(9, Math.round(size * 0.17))}px`, color: "#fb923c", lineHeight: 1,
        }}>ERP</span>
        <span style={{ width: "22px", height: "2px", background: "#EA5B0C" }} />
      </div>
    </div>
  );
}
