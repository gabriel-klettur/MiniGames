import { useMemo, useRef, useCallback } from 'react';
import type { FlyingPieceState } from '../useAnimations';

export function useHistoryUI(params: {
  historyLength: number;
  autoRunningRef: React.MutableRefObject<boolean>;
  iaBusy: boolean;
  flying: FlyingPieceState | null;
  onUndo: () => void;
}) {
  const { historyLength, autoRunningRef, iaBusy, flying, onUndo } = params;
  const undoQueuedRef = useRef<boolean>(false);

  const canUndo = useMemo(
    () => historyLength > 0 && !autoRunningRef.current && !iaBusy,
    [historyLength, autoRunningRef.current, iaBusy]
  );

  const onUndoClick = useCallback(() => {
    if (flying) {
      undoQueuedRef.current = true;
      return;
    }
    onUndo();
  }, [flying, onUndo]);

  const flushQueuedUndo = useCallback(() => {
    if (undoQueuedRef.current) {
      undoQueuedRef.current = false;
      onUndo();
    }
  }, [onUndo]);

  return { canUndo, onUndoClick, flushQueuedUndo } as const;
}
