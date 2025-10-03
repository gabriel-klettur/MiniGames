import { SymbolIcon } from '../Icons';
import type { SymbolType } from '../../game/types';

interface TokenStackProps {
  stack: SymbolType[]; // bottom -> top
}

/**
 * TokenStack — Renderiza los discos por debajo del tope, con z-index y variable CSS --i.
 */
export default function TokenStack({ stack }: TokenStackProps) {
  const below = stack.slice(0, Math.max(0, stack.length - 1));
  const count = below.length;
  return (
    <div className="token-stack" aria-hidden="true">
      {below.slice().reverse().map((sym, i) => (
        <div key={i} className="token-disc-img" style={{ ['--i' as any]: i + 1, zIndex: (count - i) }}>
          <SymbolIcon type={sym} />
        </div>
      ))}
    </div>
  );
}
