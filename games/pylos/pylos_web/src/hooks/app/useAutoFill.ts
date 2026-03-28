import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../game/types';
import { getCell, posKey, setCell } from '../../game/board';
import { validReserveDestinations } from '../../game/rules';
import bolaA from '../../assets/bola_a.webp';
import bolaB from '../../assets/bola_b.webp';
import type { MoveEntry } from '../usePersistence';
import type { FlyingPieceState } from '../useAnimations';

export interface UseAutoFillParams {
  state: GameState;
  gameOver: string | undefined;
  flying: FlyingPieceState | null;
  autoRunningRef: React.MutableRefObject<boolean>;
  autoSuppressedRef: React.MutableRefObject<boolean>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;
  setPendingState: React.Dispatch<React.SetStateAction<GameState | null>>;
  setPendingLog: React.Dispatch<React.SetStateAction<MoveEntry | null>>;
  pendingApplyRef: React.MutableRefObject<{ pushHistory: boolean; clearRedo: boolean }>;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
  setAppearKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  updateAndCheck: (
    nextState: GameState,
    pushHistory?: boolean,
    clearRedo?: boolean,
    logEntry?: MoveEntry
  ) => void;
}

export interface UseAutoFillResult {
  autoFillDelayMs: number;
  setAutoFillDelayMs: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Encapsula la lógica de autocompletar la pirámide cuando las reservas se agotan en un lado.
 * Reproduce el efecto de App.tsx, exponiendo solo el control de retardo.
 */
export function useAutoFill(params: UseAutoFillParams): UseAutoFillResult {
  const {
    state,
    gameOver,
    flying,
    autoRunningRef,
    autoSuppressedRef,
    reserveLightRef,
    reserveDarkRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
  } = params;

  const [autoFillDelayMs, setAutoFillDelayMs] = useState<number>(250);
  const autoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // If Undo just collapsed AUTO, skip one auto-fill cycle to avoid re-triggering immediately.
    if (autoSuppressedRef.current) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // Stop any scheduling if game over or during recovery or while a flying anim is running
    if (gameOver || state.phase === 'recover' || !!flying) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // Determine filler player according to reserves
    const { L, D } = state.reserves;
    const filler: 'L' | 'D' | null = L === 0 && D > 0 ? 'D' : D === 0 && L > 0 ? 'L' : null;

    // If no auto-completion needed, ensure timer is cleared and exit
    if (!filler) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // If the top is already occupied, no need to continue
    const top = getCell(state.board, { level: 3, row: 0, col: 0 });
    if (top !== null) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // If a timer is already scheduled, do not schedule another
    if (autoTimerRef.current !== null) return;

    autoRunningRef.current = true;
    autoTimerRef.current = window.setTimeout(() => {
      autoTimerRef.current = null; // allow scheduling next

      const dests = validReserveDestinations(state.board)
        .slice()
        .sort((a, b) => a.level - b.level || a.row - b.row || a.col - b.col);

      if (dests.length === 0) {
        autoRunningRef.current = false;
        return;
      }

      const dest = dests[0];
      const board = setCell(state.board, dest, filler);
      const newReserves = { ...state.reserves, [filler]: state.reserves[filler] - 1 } as typeof state.reserves;
      const nextState: GameState = {
        ...state,
        board,
        reserves: newReserves,
        currentPlayer: filler,
        phase: 'play',
        selectedSource: undefined,
        recovery: undefined,
      };

      // Compute animation origin from InfoPanel reserve icons
      const originEl = filler === 'L' ? reserveLightRef.current : reserveDarkRef.current;
      const originRect = originEl?.getBoundingClientRect();
      const key = posKey(dest);
      const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
      const destRect = destBtn?.getBoundingClientRect();
      const imgSrc = filler === 'L' ? bolaB : bolaA;

      const autoLog: MoveEntry = { player: filler, source: 'AUTO', text: `colocar ${key}` };
      if (originRect && destRect) {
        const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
        const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
        setPendingState(nextState);
        setPendingLog(autoLog);
        pendingApplyRef.current = { pushHistory: true, clearRedo: true };
        setFlying({ from, to, imgSrc, destKey: key });
      } else {
        setAppearKeys(new Set([key]));
        updateAndCheck(nextState, true, true, autoLog);
      }
    }, Math.max(0, autoFillDelayMs));

    return () => {
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [state, gameOver, flying, autoFillDelayMs]);

  return { autoFillDelayMs, setAutoFillDelayMs };
}
