import { useCallback, useRef } from 'react';
import type { GameState } from '../../game/types';
import type { FlyingPieceState } from '../useAnimations';

export interface UseMirrorPreviewParams {
  state: GameState;
  setState: (s: GameState) => void;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
  autoRunningRef: React.MutableRefObject<boolean>;
}

export interface UseMirrorPreviewResult {
  onMirrorStart: () => void;
  onMirrorUpdate: (s: GameState) => void;
  onMirrorEnd: (s: GameState) => void;
}

/**
 * Provides callbacks for InfoIA to mirror fast simulations without animations,
 * temporarily blocking user interactions and restoring the original board after.
 */
export function useMirrorPreview(params: UseMirrorPreviewParams): UseMirrorPreviewResult {
  const { state, setState, setFlying, autoRunningRef } = params;
  const mirrorPrevStateRef = useRef<GameState | null>(null);

  const onMirrorStart = useCallback(() => {
    try { setFlying(null); } catch {}
    mirrorPrevStateRef.current = state;
    autoRunningRef.current = true;
  }, [state]);

  const onMirrorUpdate = useCallback((s: GameState) => {
    try { setFlying(null); } catch {}
    setState(s);
  }, []);

  const onMirrorEnd = useCallback((_s: GameState) => {
    try { setFlying(null); } catch {}
    if (mirrorPrevStateRef.current) {
      setState(mirrorPrevStateRef.current);
      mirrorPrevStateRef.current = null;
    }
    autoRunningRef.current = false;
  }, []);

  return { onMirrorStart, onMirrorUpdate, onMirrorEnd };
}
