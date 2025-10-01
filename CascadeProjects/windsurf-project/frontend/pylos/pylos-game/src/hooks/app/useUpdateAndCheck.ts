import { useCallback } from 'react';
import type { GameState } from '../../game/types';
import type { MoveEntry } from '../usePersistence';
import { isGameOver } from '../../game/rules';
import { computeKey } from '../../ia/zobrist';
import { recordStateKey } from '../../utils/repetitionDb';

export interface UseUpdateAndCheckParams {
  state: GameState;
  moves: MoveEntry[];
  vsAI: null | { enemy: 'L' | 'D'; depth: number };
  iaDepth: number;
  iaTimeMode: 'auto' | 'manual';
  iaTimeSeconds: number;
  archivedRef: React.MutableRefObject<boolean>;
  setState: (s: GameState) => void;
  setHistory: React.Dispatch<React.SetStateAction<GameState[]>>;
  setRedo: React.Dispatch<React.SetStateAction<GameState[]>>;
  setMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setRedoMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setFinishedGames: React.Dispatch<React.SetStateAction<any[]>>;
  setGameOver: React.Dispatch<React.SetStateAction<string | undefined>>;
  logSnapshot: (snapshot: GameState, label?: string) => void;
}

export function useUpdateAndCheck(params: UseUpdateAndCheckParams) {
  const {
    state,
    moves,
    vsAI,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
    archivedRef,
    setState,
    setHistory,
    setRedo,
    setMoves,
    setRedoMoves,
    setFinishedGames,
    setGameOver,
    logSnapshot,
  } = params;

  const updateAndCheck = useCallback((
    nextState: GameState,
    pushHistory: boolean = true,
    clearRedo: boolean = true,
    logEntry?: MoveEntry,
  ) => {
    if (pushHistory) {
      setHistory((h) => [...h, state]);
    }
    if (clearRedo) {
      setRedo([]);
      setRedoMoves([]);
    }
    if (logEntry) {
      setMoves((m) => [...m, logEntry]);
    }
    setState(nextState);
    logSnapshot(nextState);
    // Persistently record the next state's Zobrist key to support cross-game repetition avoidance.
    try {
      const k = computeKey(nextState);
      recordStateKey(k);
    } catch {}

    const over = isGameOver(nextState);
    if (over.over) {
      const text = over.winner ? `Ganador: ${over.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)'} — ${over.reason ?? ''}` : 'Partida terminada';
      setGameOver(text);
      if (!archivedRef.current) {
        const now = new Date();
        const record = {
          id: String(now.getTime()),
          endedAt: now.toISOString(),
          winner: over.winner ?? null,
          reason: over.reason,
          vsAI,
          iaDepth,
          iaTimeMode,
          iaTimeSeconds,
          totalMoves: moves.length + (logEntry ? 1 : 0),
          moves: logEntry ? [...moves, logEntry] : [...moves],
        };
        setFinishedGames((prev) => [...prev, record]);
        archivedRef.current = true;
      }
    } else {
      setGameOver(undefined);
    }
  }, [state, moves, vsAI, iaDepth, iaTimeMode, iaTimeSeconds, archivedRef, setState, setHistory, setRedo, setRedoMoves, setMoves, setFinishedGames, setGameOver, logSnapshot]);

  return updateAndCheck;
}
