import { useEffect, useState } from 'react';

export interface IaAdvancedConfig {
  quiescence: boolean;
  qDepthMax: number; // 0..4
  qNodeCap: number; // 1..128
  futilityMargin: number; // 0..1000
  bookEnabled: boolean;
  // Mode to resolve the book URL
  bookMode?: 'auto' | 'manual';
  // When in auto mode, which phase to target within the chosen difficulty
  bookPhase?: 'aperturas' | 'medio' | 'cierres';
  // Optional base path for auto mode (defaults to '/books')
  bookBasePath?: string;
  bookUrl: string;
  precomputedSupports?: boolean;
  precomputedCenter?: boolean;
  pvsEnabled?: boolean;
  aspirationEnabled?: boolean;
  ttEnabled?: boolean;
  avoidRepeats?: boolean;
  repeatMax?: number; // 1..10
  avoidPenalty?: number; // 0..500
  // Start behavior
  startRandomFirstMove?: boolean;
  startSeed?: number | null;
  startMode?: 'book' | 'random' | 'center-topk';
  startCenterTopK?: number;
}

const STORAGE_KEY = 'pylos.ia.advanced.v1';

/**
 * Keeps IA advanced configuration in React state and persists it to localStorage.
 * Mirrors and encapsulates the logic previously embedded in App.tsx.
 */
export function useIaAdvancedConfig(): [IaAdvancedConfig, React.Dispatch<React.SetStateAction<IaAdvancedConfig>>] {
  const [cfg, setCfg] = useState<IaAdvancedConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          return {
            quiescence: typeof p.quiescence === 'boolean' ? p.quiescence : true,
            qDepthMax: Number.isFinite(p.qDepthMax) ? Math.max(0, Math.min(4, Math.floor(p.qDepthMax))) : 2,
            qNodeCap: Number.isFinite(p.qNodeCap) ? Math.max(1, Math.min(128, Math.floor(p.qNodeCap))) : 24,
            futilityMargin: Number.isFinite(p.futilityMargin) ? Math.max(0, Math.min(1000, Math.floor(p.futilityMargin))) : 100,
            bookEnabled: typeof p.bookEnabled === 'boolean' ? p.bookEnabled : false,
            bookMode: (p.bookMode === 'manual' || p.bookMode === 'auto') ? p.bookMode : 'auto',
            bookPhase: (p.bookPhase === 'aperturas' || p.bookPhase === 'medio' || p.bookPhase === 'cierres') ? p.bookPhase : 'aperturas',
            bookBasePath: (typeof p.bookBasePath === 'string' && p.bookBasePath.trim().length > 0) ? p.bookBasePath : '/books',
            bookUrl: typeof p.bookUrl === 'string' && p.bookUrl.trim().length > 0 ? p.bookUrl : '/aperturas_book.json',
            precomputedSupports: typeof p.precomputedSupports === 'boolean' ? p.precomputedSupports : true,
            precomputedCenter: typeof p.precomputedCenter === 'boolean' ? p.precomputedCenter : true,
            pvsEnabled: typeof p.pvsEnabled === 'boolean' ? p.pvsEnabled : true,
            aspirationEnabled: typeof p.aspirationEnabled === 'boolean' ? p.aspirationEnabled : true,
            ttEnabled: typeof p.ttEnabled === 'boolean' ? p.ttEnabled : true,
            avoidRepeats: typeof p.avoidRepeats === 'boolean' ? p.avoidRepeats : true,
            repeatMax: Number.isFinite(p.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : 3,
            avoidPenalty: Number.isFinite(p.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : 50,
            startRandomFirstMove: typeof p.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : false,
            startSeed: (Number.isFinite(p.startSeed) ? Math.floor(p.startSeed) : null),
            startMode: (p.startMode === 'book' || p.startMode === 'random' || p.startMode === 'center-topk') ? p.startMode : undefined,
            startCenterTopK: Number.isFinite(p.startCenterTopK) ? Math.max(1, Math.min(16, Math.floor(p.startCenterTopK))) : undefined,
          } as IaAdvancedConfig;
        }
      }
    } catch {}
    return {
      quiescence: true,
      qDepthMax: 2,
      qNodeCap: 24,
      futilityMargin: 100,
      bookEnabled: false,
      bookMode: 'auto',
      bookPhase: 'aperturas',
      bookBasePath: '/books',
      bookUrl: '/aperturas_book.json',
      precomputedSupports: true,
      precomputedCenter: true,
      pvsEnabled: true,
      aspirationEnabled: true,
      ttEnabled: true,
      avoidRepeats: true,
      repeatMax: 3,
      avoidPenalty: 50,
      startRandomFirstMove: false,
      startSeed: null,
      startMode: 'book',
      startCenterTopK: 4,
    } as IaAdvancedConfig;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }, [cfg]);

  return [cfg, setCfg];
}
