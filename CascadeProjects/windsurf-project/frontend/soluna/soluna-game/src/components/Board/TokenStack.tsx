import { SymbolIcon } from '../Icons';
import type { SymbolType } from '../../game/types';

interface TokenStackProps {
  stack: SymbolType[]; // bottom -> top
}

/**
 * TokenStack — Renderiza TODA la pila anclada a la base (nivel 0 en el centro) y crece hacia ARRIBA.
 * Base (stack[0]) se mantiene quieta en el centro; niveles superiores se apilan arriba.
 */
export default function TokenStack({ stack }: TokenStackProps) {
  const full = stack; // base -> top
  return (
    <div className="token-stack" aria-hidden="true">
      {full.map((sym, i) => (
        <div key={i} className="token-disc-img stack-up" style={{ ['--i' as any]: i, zIndex: i + 1 }}>
          <SymbolIcon type={sym} />
        </div>
      ))}
    </div>
  );
}
