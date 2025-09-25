import { useEffect, useState } from 'react';
import type { GameState } from '../game/types';
import { initialState } from '../game/rules';

// LocalStorage keys for persistence (exported for reuse in UI components if needed)
export const LS_KEYS = {
  game: 'pylos.game.v1',
  moves: 'pylos.moves.v1',
  vsai: 'pylos.vsai.v1',
  ia: 'pylos.ia.config.v1',
  iaShow: 'pylos.ia.showUser.v1',
} as const;

export type MoveEntry = { player: 'L' | 'D'; source: 'PLAYER' | 'IA' | 'AUTO'; text: string };

type VsAIConfig = null | { enemy: 'L' | 'D'; depth: number };

export interface UsePersistenceResult {
  state: GameState;
  setState: (s: GameState) => void;

  moves: MoveEntry[];
  setMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;

  vsAI: VsAIConfig;
  setVsAI: React.Dispatch<React.SetStateAction<VsAIConfig>>;

  iaDepth: number;
  setIaDepth: React.Dispatch<React.SetStateAction<number>>;
  iaTimeMode: 'auto' | 'manual';
  setIaTimeMode: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
  iaTimeSeconds: number;
  setIaTimeSeconds: React.Dispatch<React.SetStateAction<number>>;

  showIAUser: boolean;
  setShowIAUser: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * usePersistence centraliza la inicialización desde localStorage y la
 * persistencia reactiva de los estados principales del juego y de la IA.
 * Mantiene la misma semántica y valores por defecto que el código previo en App.tsx.
 */
export function usePersistence(): UsePersistenceResult {
  const [state, _setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.game);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.board && parsed.reserves && parsed.currentPlayer) {
          return parsed as GameState;
        }
      }
    } catch {}
    return initialState();
  });

  const [moves, setMoves] = useState<MoveEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.moves);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list as MoveEntry[];
      }
    } catch {}
    return [];
  });

  const [showIAUser, setShowIAUser] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.iaShow);
      if (raw != null) return raw === 'true';
    } catch {}
    return false;
  });

  const [iaDepth, setIaDepth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.ia);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.depth === 'number') return p.depth;
      }
    } catch {}
    return 3;
  });

  const [iaTimeMode, setIaTimeMode] = useState<'auto' | 'manual'>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.ia);
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.timeMode === 'auto' || p?.timeMode === 'manual') return p.timeMode;
      }
    } catch {}
    return 'manual';
  });

  const [iaTimeSeconds, setIaTimeSeconds] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.ia);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.timeSeconds === 'number') return p.timeSeconds;
      }
    } catch {}
    return 8; // default manual 8s
  });

  const [vsAI, setVsAI] = useState<VsAIConfig>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.vsai);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && (p.enemy === 'L' || p.enemy === 'D') && typeof p.depth === 'number') return p as VsAIConfig;
      }
    } catch {}
    return null;
  });

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.game, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.moves, JSON.stringify(moves));
    } catch {}
  }, [moves]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.vsai, JSON.stringify(vsAI));
    } catch {}
  }, [vsAI]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEYS.ia,
        JSON.stringify({ depth: iaDepth, timeMode: iaTimeMode, timeSeconds: iaTimeSeconds }),
      );
    } catch {}
  }, [iaDepth, iaTimeMode, iaTimeSeconds]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.iaShow, String(showIAUser));
    } catch {}
  }, [showIAUser]);

  // Wrapper to keep setState signature identical to React's setter (value only)
  const setState = (next: GameState) => _setState(next);

  return {
    state,
    setState,
    moves,
    setMoves,
    vsAI,
    setVsAI,
    iaDepth,
    setIaDepth,
    iaTimeMode,
    setIaTimeMode,
    iaTimeSeconds,
    setIaTimeSeconds,
    showIAUser,
    setShowIAUser,
  };
}

