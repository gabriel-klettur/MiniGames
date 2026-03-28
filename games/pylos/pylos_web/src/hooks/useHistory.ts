import { useRef, useState } from 'react';
import type { GameState } from '../game/types';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';
import type { MoveEntry } from './usePersistence';
import type { FlyingPieceState, Rect } from './useAnimations';

export interface UseHistoryResult {
  history: GameState[];
  setHistory: React.Dispatch<React.SetStateAction<GameState[]>>;
  redo: GameState[];
  setRedo: React.Dispatch<React.SetStateAction<GameState[]>>;
  redoingRef: React.MutableRefObject<boolean>;
  onUndo: () => void;
}

/**
 * Gestiona pilas de historial/rehacer y expone `onUndo` con animaciones.
 * Requiere funciones para aplicar estado (`updateAndCheck`) y para programar animación (`setFlying`).
 */
export function useHistoryLogic(params: {
  state: GameState;
  moves: MoveEntry[];
  setMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setRedoMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  flying: FlyingPieceState | null;
  autoRunningRef: React.MutableRefObject<boolean>;
  autoSuppressedRef: React.MutableRefObject<boolean>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;
  updateAndCheck: (nextState: GameState, pushHistory?: boolean, clearRedo?: boolean, logEntry?: MoveEntry) => void;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
}): UseHistoryResult {
  const { state, moves, setMoves, setRedoMoves, flying, autoRunningRef, autoSuppressedRef, reserveLightRef, reserveDarkRef, updateAndCheck, setFlying } = params;

  const [history, setHistory] = useState<GameState[]>([]);
  const [redo, setRedo] = useState<GameState[]>([]);
  const redoingRef = useRef<boolean>(false);

  const onUndo = () => {
    if (flying || autoRunningRef.current) return;
    if (history.length === 0) return;
    const lastLog = moves.length > 0 ? moves[moves.length - 1] : undefined;

    let autoCount = 0;
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i]?.source === 'AUTO') autoCount++;
      else break;
    }

    if (autoCount > 0 && history.length - autoCount >= 0) {
      autoSuppressedRef.current = true;
      const targetPrev = history[history.length - autoCount];
      setHistory((h) => h.slice(0, -autoCount));
      setRedo((r) => [...r, state]);
      if (autoCount > 0) {
        const tail = moves.slice(-autoCount);
        setRedoMoves((rm) => [...rm, ...tail]);
        setMoves((m) => m.slice(0, -autoCount));
      }
      updateAndCheck(targetPrev, false, false);
      return;
    }

    const prev = history[history.length - 1];

    // Update stacks
    setHistory((h) => h.slice(0, -1));
    setRedo((r) => [...r, state]);
    if (lastLog) {
      setRedoMoves((rm) => [...rm, lastLog]);
      setMoves((m) => m.slice(0, -1));
    }

    // Try to animate inverse of lastLog
    let fromRect: Rect | null = null;
    let toRect: Rect | null = null;
    let imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA; // default; will use lastLog.player if present
    let appearKey = '';
    if (lastLog) {
      const p = lastLog.player;
      imgSrc = p === 'L' ? bolaB : bolaA;
      if (lastLog.text.startsWith('colocar ')) {
        const key = lastLog.text.replace('colocar ', '').trim();
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const srcRect = srcBtn?.getBoundingClientRect();
        const destEl = p === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const destRect = destEl?.getBoundingClientRect();
        if (srcRect && destRect) {
          fromRect = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          toRect = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          appearKey = key; // harmless; appear after removal
        }
      } else if (lastLog.text.startsWith('subir ')) {
        // format: subir src -> dest
        const rest = lastLog.text.replace('subir ', '').trim();
        const [src, dst] = rest.split('->').map((s) => s.trim());
        const dstBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${dst}"]`);
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${src}"]`);
        const dRect = dstBtn?.getBoundingClientRect();
        const sRect = srcBtn?.getBoundingClientRect();
        if (dRect && sRect) {
          // Undo goes from dest back to src
          fromRect = { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height };
          toRect = { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height };
          appearKey = src;
        }
      } else if (lastLog.text.startsWith('recuperar ')) {
        const key = lastLog.text.replace('recuperar ', '').trim();
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const destRect = destBtn?.getBoundingClientRect();
        const srcEl = p === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const srcRect = srcEl?.getBoundingClientRect();
        if (srcRect && destRect) {
          // Undo recovery: bring piece back from reserve to board
          fromRect = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          toRect = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          appearKey = key;
        }
      }
    }

    if (fromRect && toRect) {
      // Flag that a redo-style animation is happening to pause auto IA triggers
      redoingRef.current = true;
      // Schedule the visual overlay flight using the DOM rects captured above
      (window.requestAnimationFrame || setTimeout)(() => {
        setFlying({ from: fromRect as Rect, to: toRect as Rect, imgSrc, destKey: appearKey });
      });
      // Apply previous state immediately so Undo takes effect even with animation.
      // We cannot rely on FlyingPiece onDone because pendingState is not set for undo.
      updateAndCheck(prev, false, false);
    } else {
      // Fallback: apply immediately without animation
      updateAndCheck(prev, false, false);
    }
  };

  return { history, setHistory, redo, setRedo, redoingRef, onUndo };
}

