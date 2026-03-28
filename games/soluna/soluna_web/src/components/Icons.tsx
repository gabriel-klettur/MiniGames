import type { SymbolType } from '../game/types';
import { useTokenSet } from '../contexts/TokenSetContext';

/**
 * SymbolIcon — renders a token symbol image based on the symbol type.
 * Replaces the previous inline SVGs with PNG assets so designers can swap art easily.
 */
export function SymbolIcon({ type }: { type: SymbolType }) {
  const { getSymbolUrl } = useTokenSet();
  const src = getSymbolUrl(type);
  const alt = type.charAt(0).toUpperCase() + type.slice(1);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
