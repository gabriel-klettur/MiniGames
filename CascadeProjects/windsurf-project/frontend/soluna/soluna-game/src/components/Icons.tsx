import type { SymbolType } from '../game/types';

export function SymbolIcon({ type }: { type: SymbolType }) {
  switch (type) {
    case 'sol':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-label="Sol">
          <defs>
            <radialGradient id="gSunCore" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#fff3a6" />
              <stop offset="70%" stopColor="#ffe066" />
              <stop offset="100%" stopColor="#f6d84a" />
            </radialGradient>
          </defs>
          {/* Triangular rays to resemble box art */}
          <g fill="#f6d84a">
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="32,6 36,16 28,16"
                transform={`rotate(${(i * 360) / 16} 32 32)`}
                opacity={0.95}
              />
            ))}
          </g>
          {/* Sun core */}
          <circle cx="32" cy="32" r="14" fill="url(#gSunCore)" stroke="#f0c93a" strokeWidth="1.5" />
        </svg>
      );
    case 'luna':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-label="Luna">
          <defs>
            {/* Mask to cut a classic crescent shape independent of background */}
            <mask id="mCrescent">
              <rect x="0" y="0" width="64" height="64" fill="black" />
              <circle cx="30" cy="32" r="18" fill="white" />
              <circle cx="40" cy="28" r="20" fill="black" />
            </mask>
            <radialGradient id="gMoonFill" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff6c8" />
              <stop offset="100%" stopColor="#f1de7a" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="64" height="64" fill="none" />
          <circle cx="32" cy="32" r="22" fill="url(#gMoonFill)" mask="url(#mCrescent)" />
        </svg>
      );
    case 'estrella':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-label="Estrellas">
          {/* Cluster of small 4-point stars */}
          <g fill="#ffffff" stroke="#ffffff" strokeLinejoin="round">
            {[
              { x: 20, y: 28, s: 5 },
              { x: 30, y: 36, s: 4 },
              { x: 40, y: 24, s: 6 },
              { x: 24, y: 44, s: 3.5 },
            ].map(({ x, y, s }, i) => (
              <g key={i} transform={`translate(${x} ${y})`} opacity={0.98}>
                <polygon points={`0,${-s} ${s * 0.7},0 0,${s} ${-s * 0.7},0`} />
                <polygon points={`0,${-s * 0.55} ${s * 0.4},0 0,${s * 0.55} ${-s * 0.4},0`} transform="rotate(45)" />
              </g>
            ))}
          </g>
        </svg>
      );
    case 'fugaz':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-label="Estrella fugaz">
          <defs>
            <linearGradient id="gCometTail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a6d3ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          {/* Curved tail */}
          <path d="M10 46 C 24 40, 40 32, 56 20" stroke="url(#gCometTail)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
          {/* Star head */}
          <g transform="translate(56 20)" fill="#ffffff" stroke="#ffffff">
            <polygon points="0,-4 3,0 0,4 -3,0" />
            <polygon points="0,-2.5 2,0 0,2.5 -2,0" transform="rotate(45)" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}
