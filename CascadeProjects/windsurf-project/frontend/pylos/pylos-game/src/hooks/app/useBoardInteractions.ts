import type { GameState, Position } from '../../game/types';
import { cancelMoveSelection, finishRecovery, movePiece, placeFromReserve, recoverPiece, selectMoveSource } from '../../game/rules';
import { getCell, isFree, posKey } from '../../game/board';
import bolaA from '../../assets/bola_a.webp';
import bolaB from '../../assets/bola_b.webp';
import type { FlyingPieceState } from '../useAnimations';
import type { MoveEntry } from '../usePersistence';
import { useCallback } from 'react';

export interface UseBoardInteractionsParams {
  state: GameState;
  gameOver: string | undefined;
  flying: FlyingPieceState | null;
  autoRunningRef: React.MutableRefObject<boolean>;

  // Refs used to measure animation origins
  currentPieceRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;

  // Animation/state staging helpers
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

export interface UseBoardInteractionsResult {
  onCellClick: (pos: Position) => void;
  onDragStart: (pos: Position) => void;
  onDragEnd: () => void;
  onFinishRecovery: () => void;
}

/**
 * Encapsula los handlers de interacción del tablero (click/drag y recuperación)
 * y respeta las mismas condiciones y animaciones que se implementaban en App.tsx.
 */
export function useBoardInteractions(params: UseBoardInteractionsParams): UseBoardInteractionsResult {
  const {
    state,
    gameOver,
    flying,
    autoRunningRef,
    currentPieceRef,
    reserveLightRef,
    reserveDarkRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
  } = params;

  const onCellClick = useCallback((pos: Position) => {
    if (gameOver) return;
    if (autoRunningRef.current) return;
    if (flying) return;

    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) {
        const key = posKey(pos);
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const srcRect = srcBtn?.getBoundingClientRect();
        const destEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const destRect = destEl?.getBoundingClientRect();
        const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `recuperar ${key}` };
        if (srcRect && destRect) {
          const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          updateAndCheck(res.state, true, true, log);
          setFlying({ from, to, imgSrc, destKey: '' });
        } else {
          updateAndCheck(res.state, true, true, log);
        }
      }
      return;
    }

    if (state.phase === 'selectMoveDest') {
      const srcKey = state.selectedSource ? posKey(state.selectedSource) : '';
      if (state.selectedSource && posKey(pos) === srcKey) {
        const res = cancelMoveSelection(state);
        if (!res.error) updateAndCheck(res.state, false, false);
        return;
      }
      const owner = getCell(state.board, pos);
      if (owner === state.currentPlayer && isFree(state.board, pos)) {
        const sel = selectMoveSource(state, pos);
        if (!sel.error) updateAndCheck(sel.state, false, false);
        return;
      }
      const attempt = movePiece(state, pos);
      if (!attempt.error) {
        const srcKey2 = state.selectedSource ? posKey(state.selectedSource) : '?';
        const dstKey = posKey(pos);
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `subir ${srcKey2} -> ${dstKey}` };
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${srcKey2}"]`);
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${dstKey}"]`);
        const sRect = srcBtn?.getBoundingClientRect();
        const dRect = destBtn?.getBoundingClientRect();
        const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
        if (sRect && dRect) {
          const from = { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height };
          const to = { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height };
          setPendingState(attempt.state);
          setPendingLog(log);
          pendingApplyRef.current = { pushHistory: true, clearRedo: true };
          setFlying({ from, to, imgSrc, destKey: dstKey, srcKey: srcKey2 });
        } else {
          setAppearKeys(new Set([dstKey]));
          updateAndCheck(attempt.state, true, true, log);
        }
      }
      return;
    }

    // phase 'play'
    const placed = placeFromReserve(state, pos);
    if (!placed.error) {
      const key = posKey(pos);
      const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `colocar ${key}` };
      const tryAnimatePlace = (attempt: number) => {
        const primaryOriginEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const fallbackOriginEl = currentPieceRef.current;
        const originEl = primaryOriginEl ?? fallbackOriginEl ?? null;
        const originRect = originEl?.getBoundingClientRect();
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const destRect = destBtn?.getBoundingClientRect();
        if (originRect && destRect) {
          const minSize = 12;
          const from = { left: originRect.left, top: originRect.top, width: Math.max(minSize, originRect.width), height: Math.max(minSize, originRect.height) };
          const to = { left: destRect.left, top: destRect.top, width: Math.max(minSize, destRect.width), height: Math.max(minSize, destRect.height) };
          const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
          setFlying({ from, to, imgSrc, destKey: key });
          setPendingState(placed.state);
          setPendingLog(log);
          pendingApplyRef.current = { pushHistory: true, clearRedo: true };
        } else if (attempt < 3) {
          requestAnimationFrame(() => tryAnimatePlace(attempt + 1));
        } else {
          setAppearKeys(new Set([key]));
          updateAndCheck(placed.state, true, true, log);
        }
      };
      requestAnimationFrame(() => tryAnimatePlace(1));
      return;
    }

    // Else, try selecting a movable source
    const sel = selectMoveSource(state, pos);
    if (!sel.error) {
      updateAndCheck(sel.state, false, false);
      return;
    }
  }, [state, gameOver, flying]);

  const onDragStart = useCallback((pos: Position) => {
    if (gameOver) return;
    if (flying) return;
    if (autoRunningRef.current) return;
    const sel = selectMoveSource(state, pos);
    if (!sel.error) updateAndCheck(sel.state, false);
  }, [state, gameOver, flying]);

  const onDragEnd = useCallback(() => {
    if (state.phase === 'selectMoveDest') {
      const res = cancelMoveSelection(state);
      if (!res.error) updateAndCheck(res.state, false, false);
    }
  }, [state]);

  const onFinishRecovery = useCallback(() => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state, true, true, { player: state.currentPlayer, source: 'PLAYER', text: 'fin recuperación' });
  }, [state]);

  return { onCellClick, onDragStart, onDragEnd, onFinishRecovery };
}
