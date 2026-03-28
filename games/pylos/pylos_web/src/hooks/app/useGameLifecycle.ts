import type { GameState } from '../../game/types';
import { initialState } from '../../game/rules';
import type { MoveEntry } from '../usePersistence';

export interface UseGameLifecycleParams {
  setState: (s: GameState) => void;
  setHistory: React.Dispatch<React.SetStateAction<GameState[]>>;
  setRedo: React.Dispatch<React.SetStateAction<GameState[]>>;
  setMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setRedoMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setVsAI: React.Dispatch<React.SetStateAction<null | { enemy: 'L' | 'D'; depth: number }>>;
  setIaDepth: React.Dispatch<React.SetStateAction<number>>;
  setShowIAUser: React.Dispatch<React.SetStateAction<boolean>>;
  setGameOver: React.Dispatch<React.SetStateAction<string | undefined>>;
  logSnapshot: (snapshot: GameState, label?: string) => void;
}

export interface UseGameLifecycleResult {
  onNewGame: () => void;
  onStartVsAI: (enemy: 'L' | 'D', depth: number) => void;
}

export function useGameLifecycle(params: UseGameLifecycleParams): UseGameLifecycleResult {
  const { setState, setHistory, setRedo, setMoves, setRedoMoves, setVsAI, setIaDepth, setShowIAUser, setGameOver, logSnapshot } = params;

  const onNewGame = () => {
    setGameOver(undefined);
    const init = initialState();
    setState(init);
    setHistory([]);
    setRedo([]);
    setMoves([]);
    setRedoMoves([]);
    setVsAI(null);
    logSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  const onStartVsAI = (enemy: 'L' | 'D', depth: number) => {
    setGameOver(undefined);
    const init = initialState();
    // Ajustamos el primer jugador si fuera necesario; conservamos el mismo comportamiento que App.tsx
    const initAdjusted = { ...init, currentPlayer: 'L' as 'L' | 'D' };
    setState(initAdjusted);
    setHistory([]);
    setRedo([]);
    setMoves([]);
    setRedoMoves([]);
    setIaDepth(depth);
    setVsAI({ enemy, depth });
    setShowIAUser(false);
    logSnapshot(
      initAdjusted,
      `Nuevo juego vs IA — enemigo ${enemy === 'L' ? 'Naranja (L)' : 'Marrón (D)'} — dificultad ${depth}`
    );
  };

  return { onNewGame, onStartVsAI };
}
