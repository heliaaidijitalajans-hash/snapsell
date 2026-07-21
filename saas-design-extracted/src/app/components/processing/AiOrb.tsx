import { memo, useMemo } from "react";

type AiOrbProps = {
  size?: number;
};

const PARTICLE_COUNT = 12;

type Particle = {
  x: number;
  y: number;
  size: number;
  opacity: number;
};

/** Precomputed orbit positions on two concentric rings (identical to mobile). */
const buildParticles = (radius: number): Particle[] =>
  Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
    const onOuterRing = index % 2 === 0;
    const distance = radius * (onOuterRing ? 0.98 : 0.74);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: index % 3 === 0 ? 6 : 4,
      opacity: onOuterRing ? 0.9 : 0.45,
    };
  });

const PRIMARY = "#FF5A5F";

/**
 * Website port of SnapSell Mobile `AiOrb` — the pulsing gradient core with two
 * counter-rotating rings, glow and orbiting particles. Same timings
 * (pulse 1.6s, spin 9s, reverse 13s, orbit 16s), reproduced with CSS keyframes.
 */
const AiOrbComponent = ({ size = 200 }: AiOrbProps) => {
  const half = size / 2;
  const coreSize = size * 0.6;
  const ringSize = size * 0.86;
  const ringInnerSize = ringSize * 0.78;
  const particles = useMemo(() => buildParticles(half), [half]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <style>{`
        @keyframes snapsell-orb-pulse {
          0% { opacity: 0.18; transform: scale(0.92); }
          100% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes snapsell-orb-corepulse {
          0% { transform: scale(0.96); }
          100% { transform: scale(1.02); }
        }
        @keyframes snapsell-orb-spin { to { transform: rotate(360deg); } }
        @keyframes snapsell-orb-spin-rev { to { transform: rotate(-360deg); } }
      `}</style>

      {/* Glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: PRIMARY,
          filter: "blur(2px)",
          animation:
            "snapsell-orb-pulse 1600ms ease-in-out infinite alternate",
        }}
      />

      {/* Outer ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: ringSize,
          height: ringSize,
          borderWidth: 1.5,
          borderStyle: "solid",
          borderColor: "rgba(255,90,95,0.35)",
          borderTopColor: PRIMARY,
          animation: "snapsell-orb-spin 9000ms linear infinite",
        }}
      />

      {/* Inner ring (reverse) */}
      <div
        className="absolute rounded-full"
        style={{
          width: ringInnerSize,
          height: ringInnerSize,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "rgba(255,255,255,0.08)",
          borderLeftColor: "rgba(255,255,255,0.4)",
          animation: "snapsell-orb-spin-rev 13000ms linear infinite",
        }}
      />

      {/* Core */}
      <div
        style={{
          animation:
            "snapsell-orb-corepulse 1600ms ease-in-out infinite alternate",
        }}
      >
        <svg width={coreSize} height={coreSize} viewBox="0 0 100 100">
          <defs>
            <radialGradient id="snapsellOrbCore" cx="42%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#FF9A8B" stopOpacity={1} />
              <stop offset="45%" stopColor={PRIMARY} stopOpacity={1} />
              <stop offset="100%" stopColor="#B71C1C" stopOpacity={1} />
            </radialGradient>
            <radialGradient id="snapsellOrbHighlight" cx="38%" cy="30%" r="40%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={50} cy={50} r={48} fill="url(#snapsellOrbCore)" />
          <circle cx={50} cy={50} r={48} fill="url(#snapsellOrbHighlight)" />
        </svg>
      </div>

      {/* Orbiting particles */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: "snapsell-orb-spin 16000ms linear infinite" }}
      >
        {particles.map((particle, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              backgroundColor: PRIMARY,
              transform: `translate(${particle.x}px, ${particle.y}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const AiOrb = memo(AiOrbComponent);
