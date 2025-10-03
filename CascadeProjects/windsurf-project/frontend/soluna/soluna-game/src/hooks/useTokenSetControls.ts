import { useMemo } from 'react';
import type { SymbolType } from '../game/types';
import { useLocalStorageState } from './useLocalStorage';

export type TokenSetName = string;

export interface TokenSet {
  name: TokenSetName;
  images: Record<SymbolType, string>;
}

export interface UseTokenSetControls {
  sets: TokenSet[];
  selectedSet: TokenSetName;
  selectSet: (name: TokenSetName) => void;
  getSymbolUrl: (sym: SymbolType) => string;
}

// Eagerly import all ficha images under assets/fichas/*
// Expected structure per set: ficha_sol.png, ficha_luna.png, ficha_estrella.png, ficha_fugaz.png
// The import yields URLs that can be assigned to <img src="..." />
const modules = import.meta.glob('../assets/fichas/*/ficha_*.png', { eager: true }) as Record<string, { default: string }>;

// Build catalog at module load to avoid recomputing per hook call
const CATALOG: TokenSet[] = (() => {
  const map = new Map<string, Partial<Record<SymbolType, string>>>();
  for (const path in modules) {
    const mod = modules[path];
    // path example: '../assets/fichas/default/ficha_sol.png'
    const parts = path.split('/');
    const setName = parts[parts.length - 2];
    const file = parts[parts.length - 1];
    const symbol = (file.replace('ficha_', '').replace('.png', '') as SymbolType);
    if (!map.has(setName)) map.set(setName, {});
    map.get(setName)![symbol] = mod.default;
  }
  const out: TokenSet[] = [];
  for (const [name, images] of map) {
    // Only include well-formed sets (all 4 symbols available)
    if (images.sol && images.luna && images.estrella && images.fugaz) {
      out.push({ name, images: images as Record<SymbolType, string> });
    }
  }
  // Sort with 'default' first for UX
  out.sort((a, b) => (a.name === 'default' ? -1 : b.name === 'default' ? 1 : a.name.localeCompare(b.name)));
  return out;
})();

const DEFAULT_SET_NAME: TokenSetName = CATALOG.find((s) => s.name === 'default')?.name || (CATALOG[0]?.name ?? 'default');

export default function useTokenSetControls(): UseTokenSetControls {
  const [selectedSet, setSelectedSet] = useLocalStorageState<TokenSetName>('soluna:tokens:set', DEFAULT_SET_NAME);

  // Resolve images for the current set; fallback to default set if missing
  const activeSet = useMemo(() => {
    const found = CATALOG.find((s) => s.name === selectedSet);
    if (found) return found;
    const fallback = CATALOG.find((s) => s.name === 'default') ?? CATALOG[0];
    return fallback;
  }, [selectedSet]);

  const getSymbolUrl = (sym: SymbolType): string => {
    return activeSet?.images[sym] ?? CATALOG[0]?.images[sym] ?? '';
  };

  return {
    sets: CATALOG,
    selectedSet: activeSet?.name ?? DEFAULT_SET_NAME,
    selectSet: setSelectedSet,
    getSymbolUrl,
  };
}
