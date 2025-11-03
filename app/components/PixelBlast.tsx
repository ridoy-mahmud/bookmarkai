"use client";

// CSS-based PixelBlast-style background. Accepts a subset of props similar to the
// referenced API for easy drop-in. Unused props are ignored gracefully.
export function PixelBlast({
  color = "#5B2BAA",
  patternScale = 3,
  transparent = true,
}: {
  variant?: "circle" | "square";
  pixelSize?: number;
  color?: string;
  patternScale?: number;
  patternDensity?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleSpeed?: number;
  rippleThickness?: number;
  rippleIntensityScale?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  liquidWobbleSpeed?: number;
  speed?: number;
  edgeFade?: number;
  transparent?: boolean;
}) {
  const tint = color;
  const gridSize = Math.max(12, Math.min(48, patternScale * 12));
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ backgroundColor: transparent ? "transparent" : "black" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(1200px 600px at 50% -10%, ${tint}44, transparent),` +
            `radial-gradient(900px 500px at 85% 20%, rgba(130,90,210,0.28), transparent),` +
            `radial-gradient(700px 400px at 15% 10%, rgba(90,40,160,0.28), transparent)`,
          opacity: prefersReducedMotion ? 0.5 : 0.85,
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(130,90,210,0.08) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(130,90,210,0.08) 0 1px, transparent 1px 4px)",
          backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
          maskImage: "radial-gradient(circle at 50% 40%, black, transparent 70%)",
        }}
      />
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 animate-[twinkle_6s_linear_infinite]"
          style={{
            backgroundImage:
              "radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.35), transparent), radial-gradient(2px 2px at 70% 40%, rgba(255,255,255,0.35), transparent), radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.35), transparent), radial-gradient(2px 2px at 80% 75%, rgba(255,255,255,0.35), transparent)",
          }}
        />
      )}
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: .4 } 50% { opacity: .8 } }
      `}</style>
    </div>
  );
}


