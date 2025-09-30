import { useCallback } from 'react';
import type { GameState } from '../../game/types';
import type { MoveEntry } from '../usePersistence';
import type { FlyingPieceState } from '../useAnimations';

export function useFlyingDone(params: {
  pendingState: GameState | null;
  pendingLog: MoveEntry | null;
  pendingApplyRef: React.MutableRefObject<{ pushHistory: boolean; clearRedo: boolean }>;
  lastAppearKeyRef: React.MutableRefObject<string>;
  setAppearKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPendingState: React.Dispatch<React.SetStateAction<GameState | null>>;
  setPendingLog: React.Dispatch<React.SetStateAction<MoveEntry | null>>;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
  redoingRef: React.MutableRefObject<boolean>;
  onUndo: () => void;
  updateAndCheck: (nextState: GameState, pushHistory?: boolean, clearRedo?: boolean, logEntry?: MoveEntry) => void;
  overlapMs?: number;
  afterClear?: () => void;
}) {
  const {
    pendingState,
    pendingLog,
    pendingApplyRef,
    lastAppearKeyRef,
    setAppearKeys,
    setPendingState,
    setPendingLog,
    setFlying,
    redoingRef,
    onUndo,
    updateAndCheck,
    overlapMs = 250,
    afterClear,
  } = params;

  const onDone = useCallback(() => {
    // 1) Apply pending state (commit the board state under the flying clone)
    if (pendingState) {
      const { pushHistory, clearRedo } = pendingApplyRef.current;
      updateAndCheck(pendingState, pushHistory, clearRedo, pendingLog ?? undefined);
    }
    // 2) Trigger appear animation if needed
    if (lastAppearKeyRef.current) {
      setAppearKeys(new Set([lastAppearKeyRef.current]));
    }
    lastAppearKeyRef.current = '';
    setPendingState(null);
    setPendingLog(null);
    pendingApplyRef.current = { pushHistory: true, clearRedo: true };
    // Allow AI again after any flying animation
    redoingRef.current = false;

    // 3) Keep the flying clone a bit more to overlap composition
    window.setTimeout(() => {
      setFlying(null);
      // Allow caller to run post-clear logic (e.g., flush queued undo)
      try { afterClear?.(); } catch {}
    }, overlapMs);
  }, [pendingState, pendingLog, pendingApplyRef, lastAppearKeyRef, setAppearKeys, setPendingState, setPendingLog, setFlying, redoingRef, onUndo, updateAndCheck, overlapMs]);

  return onDone;
}
