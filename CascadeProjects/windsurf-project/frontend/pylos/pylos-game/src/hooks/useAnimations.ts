import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { posKey } from '../game/board';
import { recoverablePositions } from '../game/rules';

export type Rect = { left: number; top: number; width: number; height: number };

export interface FlyingPieceState {
  from: Rect;
  to: Rect;
  imgSrc: string;
  destKey: string; // key to trigger appear after applying state
}

export interface UseAnimationsResult {
  // Animated transitions
  flying: FlyingPieceState | null;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;

  // Apply-after-flight state staging
  pendingState: GameState | null;
  setPendingState: React.Dispatch<React.SetStateAction<GameState | null>>;
  pendingLog: { player: 'L' | 'D'; source: 'PLAYER' | 'IA' | 'AUTO'; text: string } | null;
  setPendingLog: React.Dispatch<React.SetStateAction<{
    player: 'L' | 'D';
    source: 'PLAYER' | 'IA' | 'AUTO';
    text: string;
  } | null>>;
  pendingApplyRef: React.MutableRefObject<{ pushHistory: boolean; clearRedo: boolean }>;
  lastAppearKeyRef: React.MutableRefObject<string>;

  // Cell animation keys
  appearKeys: Set<string>;
  setAppearKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  getFlashKeys: (state: GameState) => Set<string>;

  // UI/UX config
  pieceScale: number;
  setPieceScale: React.Dispatch<React.SetStateAction<number>>;
  animAppearMs: number;
  setAnimAppearMs: React.Dispatch<React.SetStateAction<number>>;
  animFlashMs: number;
  setAnimFlashMs: React.Dispatch<React.SetStateAction<number>>;
  animFlyMs: number;
  setAnimFlyMs: React.Dispatch<React.SetStateAction<number>>;

  // Board shading controls
  noShade: { 0: boolean; 1: boolean; 2: boolean; 3: boolean };
  setNoShade: React.Dispatch<React.SetStateAction<{ 0: boolean; 1: boolean; 2: boolean; 3: boolean }>>;
  shadeOnlyAvailable: boolean;
  setShadeOnlyAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  shadeOnlyHoles: boolean;
  setShadeOnlyHoles: React.Dispatch<React.SetStateAction<boolean>>;
  holeBorders: boolean;
  setHoleBorders: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Centraliza estado y parámetros de animación y UI/UX relacionados.
 * También sincroniza variables CSS globales para permitir animaciones por CSS.
 */
export function useAnimations(): UseAnimationsResult {
  // Flying animation state
  const [flying, setFlying] = useState<FlyingPieceState | null>(null);
  const [pendingState, setPendingState] = useState<GameState | null>(null);
  const [pendingLog, setPendingLog] = useState<{
    player: 'L' | 'D';
    source: 'PLAYER' | 'IA' | 'AUTO';
    text: string;
  } | null>(null);
  const pendingApplyRef = useRef<{ pushHistory: boolean; clearRedo: boolean }>({ pushHistory: true, clearRedo: true });
  const lastAppearKeyRef = useRef<string>('');

  // Cell animation keys
  const [appearKeys, setAppearKeys] = useState<Set<string>>(new Set());

  // Flash keys are derived from state on-demand (pure)
  const getFlashKeys = (state: GameState): Set<string> => {
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    return new Set<string>();
  };

  // UI/UX animation parameters
  const [pieceScale, setPieceScale] = useState<number>(1.55);
  const [animAppearMs, setAnimAppearMs] = useState<number>(280);  // Appear duration (aparición de pieza)
  const [animFlashMs, setAnimFlashMs] = useState<number>(900);  // Flash duration (remarcado de borde blanco)
  const [animFlyMs, setAnimFlyMs] = useState<number>(2000);  // Fly duration (movimiento de pieza)

  // Board shading controls
  const [noShade, setNoShade] = useState<{ 0: boolean; 1: boolean; 2: boolean; 3: boolean }>({ 0: false, 1: false, 2: false, 3: false });
  const [shadeOnlyAvailable, setShadeOnlyAvailable] = useState<boolean>(true);
  const [shadeOnlyHoles, setShadeOnlyHoles] = useState<boolean>(true);
  const [holeBorders, setHoleBorders] = useState<boolean>(false);

  // Sync global CSS variables whenever core animation params change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--piece-scale', String(pieceScale));
    root.style.setProperty('--anim-appear-ms', `${Math.max(0, animAppearMs)}ms`);
    root.style.setProperty('--anim-flash-ms', `${Math.max(0, animFlashMs)}ms`);
  }, [pieceScale, animAppearMs, animFlashMs]);

  return {
    flying,
    setFlying,
    pendingState,
    setPendingState,
    pendingLog,
    setPendingLog,
    pendingApplyRef,
    lastAppearKeyRef,
    appearKeys,
    setAppearKeys,
    getFlashKeys,
    pieceScale,
    setPieceScale,
    animAppearMs,
    setAnimAppearMs,
    animFlashMs,
    setAnimFlashMs,
    animFlyMs,
    setAnimFlyMs,
    noShade,
    setNoShade,
    shadeOnlyAvailable,
    setShadeOnlyAvailable,
    shadeOnlyHoles,
    setShadeOnlyHoles,
    holeBorders,
    setHoleBorders,
  };
}

