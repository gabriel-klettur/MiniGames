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
  // Optional: for lift animations, the origin board cell to hide during flight
  srcKey?: string;
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

  // Cells temporarily hidden (e.g., source of a lift during flight)
  hiddenKeys: Set<string>;
  setHiddenKeys: React.Dispatch<React.SetStateAction<Set<string>>>;

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

  // Board layout and geometry (CSS vars)
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  boardWidthFactor: number;
  setBoardWidthFactor: React.Dispatch<React.SetStateAction<number>>;
  boardOffsetX: number; // px
  setBoardOffsetX: React.Dispatch<React.SetStateAction<number>>;
  boardOffsetYBase: number; // px
  setBoardOffsetYBase: React.Dispatch<React.SetStateAction<number>>;
  gridOffsetExtraX: number; // px
  setGridOffsetExtraX: React.Dispatch<React.SetStateAction<number>>;
  gridOffsetExtraY: number; // px
  setGridOffsetExtraY: React.Dispatch<React.SetStateAction<number>>;
  levelGapBase: number; // px
  setLevelGapBase: React.Dispatch<React.SetStateAction<number>>;
  cellSizeMin: number; // px
  setCellSizeMin: React.Dispatch<React.SetStateAction<number>>;
  cellSizeMult: number; // multiplier
  setCellSizeMult: React.Dispatch<React.SetStateAction<number>>;
  overlayNudgeX: number; // px
  setOverlayNudgeX: React.Dispatch<React.SetStateAction<number>>;
  boardTopGap: number; // px
  setBoardTopGap: React.Dispatch<React.SetStateAction<number>>;
  boardActionsGap: number; // px
  setBoardActionsGap: React.Dispatch<React.SetStateAction<number>>;

  // Hole/ball matrix and visuals
  holeScale: number;
  setHoleScale: React.Dispatch<React.SetStateAction<number>>;
  ballMatrixScale: number;
  setBallMatrixScale: React.Dispatch<React.SetStateAction<number>>;
  holeMatrixScale: number;
  setHoleMatrixScale: React.Dispatch<React.SetStateAction<number>>;
  holeRingW: number; // px
  setHoleRingW: React.Dispatch<React.SetStateAction<number>>;
  holeInset: number; // px
  setHoleInset: React.Dispatch<React.SetStateAction<number>>;

  // Debug
  debugHitTest: boolean;
  setDebugHitTest: React.Dispatch<React.SetStateAction<boolean>>;
  // Fine-grained debug overlays
  debugShowGrid: boolean;
  setDebugShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  debugShowOverlays: boolean;
  setDebugShowOverlays: React.Dispatch<React.SetStateAction<boolean>>;
  debugShowCellOutlines: boolean;
  setDebugShowCellOutlines: React.Dispatch<React.SetStateAction<boolean>>;
  debugShowDisabledCells: boolean;
  setDebugShowDisabledCells: React.Dispatch<React.SetStateAction<boolean>>;
  debugShowClickable: boolean;
  setDebugShowClickable: React.Dispatch<React.SetStateAction<boolean>>;
  // Debug sizes (px)
  dbgGridOutlineW: number;
  setDbgGridOutlineW: React.Dispatch<React.SetStateAction<number>>;
  dbgCellOutlineW: number;
  setDbgCellOutlineW: React.Dispatch<React.SetStateAction<number>>;
  dbgDisabledOutlineW: number;
  setDbgDisabledOutlineW: React.Dispatch<React.SetStateAction<number>>;
  dbgClickableOutlineW: number;
  setDbgClickableOutlineW: React.Dispatch<React.SetStateAction<number>>;
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
  // Temporarily hidden cells (e.g., hide source on lift while flying)
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

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

  // Board layout and geometry defaults (match tokens.css)
  const [scale, setScale] = useState<number>(0.5);
  const [boardWidthFactor, setBoardWidthFactor] = useState<number>(1);
  const [boardOffsetX, setBoardOffsetX] = useState<number>(0);
  const [boardOffsetYBase, setBoardOffsetYBase] = useState<number>(-60);
  const [gridOffsetExtraX, setGridOffsetExtraX] = useState<number>(0);
  const [gridOffsetExtraY, setGridOffsetExtraY] = useState<number>(0);
  const [levelGapBase, setLevelGapBase] = useState<number>(8);
  const [cellSizeMin, setCellSizeMin] = useState<number>(36);
  const [cellSizeMult, setCellSizeMult] = useState<number>(1);
  const [overlayNudgeX, setOverlayNudgeX] = useState<number>(0);
  const [boardTopGap, setBoardTopGap] = useState<number>(0);
  const [boardActionsGap, setBoardActionsGap] = useState<number>(-40);

  // Hole/ball visuals
  const [holeScale, setHoleScale] = useState<number>(0.9);
  const [ballMatrixScale, setBallMatrixScale] = useState<number>(1.04);
  const [holeMatrixScale, setHoleMatrixScale] = useState<number>(1.04);
  const [holeRingW, setHoleRingW] = useState<number>(3);
  const [holeInset, setHoleInset] = useState<number>(2);

  // Debug
  const [debugHitTest, setDebugHitTest] = useState<boolean>(false);
  const [debugShowGrid, setDebugShowGrid] = useState<boolean>(true);
  const [debugShowOverlays, setDebugShowOverlays] = useState<boolean>(true);
  const [debugShowCellOutlines, setDebugShowCellOutlines] = useState<boolean>(true);
  const [debugShowDisabledCells, setDebugShowDisabledCells] = useState<boolean>(true);
  const [debugShowClickable, setDebugShowClickable] = useState<boolean>(true);
  // Debug outline widths (px)
  const [dbgGridOutlineW, setDbgGridOutlineW] = useState<number>(1);
  const [dbgCellOutlineW, setDbgCellOutlineW] = useState<number>(1);
  const [dbgDisabledOutlineW, setDbgDisabledOutlineW] = useState<number>(1);
  const [dbgClickableOutlineW, setDbgClickableOutlineW] = useState<number>(2);

  // Sync global CSS variables whenever core animation params change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--piece-scale', String(pieceScale));
    root.style.setProperty('--anim-appear-ms', `${Math.max(0, animAppearMs)}ms`);
    root.style.setProperty('--anim-flash-ms', `${Math.max(0, animFlashMs)}ms`);
    // Board geometry tokens
    root.style.setProperty('--scale', String(scale));
    root.style.setProperty('--board-width-factor', String(boardWidthFactor));
    root.style.setProperty('--board-offset-x', `${boardOffsetX}px`);
    root.style.setProperty('--board-offset-y-base', `${boardOffsetYBase}px`);
    root.style.setProperty('--grid-offset-extra-x', `${gridOffsetExtraX}px`);
    root.style.setProperty('--grid-offset-extra-y', `${gridOffsetExtraY}px`);
    root.style.setProperty('--level-gap-base', `${levelGapBase}px`);
    root.style.setProperty('--cell-size-min', `${cellSizeMin}px`);
    root.style.setProperty('--cell-size-mult', String(cellSizeMult));
    root.style.setProperty('--overlay-nudge-x', `${overlayNudgeX}px`);
    root.style.setProperty('--board-top-gap', `${boardTopGap}px`);
    root.style.setProperty('--board-actions-gap', `${boardActionsGap}px`);
    // Hole/ball
    root.style.setProperty('--hole-scale', String(holeScale));
    root.style.setProperty('--ball-matrix-scale', String(ballMatrixScale));
    root.style.setProperty('--hole-matrix-scale', String(holeMatrixScale));
    root.style.setProperty('--hole-ring-w', `${holeRingW}px`);
    root.style.setProperty('--hole-inset', `${holeInset}px`);
  }, [
    pieceScale, animAppearMs, animFlashMs,
    scale, boardWidthFactor, boardOffsetX, boardOffsetYBase,
    gridOffsetExtraX, gridOffsetExtraY, levelGapBase, cellSizeMin, cellSizeMult,
    overlayNudgeX, boardTopGap, boardActionsGap,
    holeScale, ballMatrixScale, holeMatrixScale, holeRingW, holeInset,
  ]);

  // Sync debug outline sizes to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--dbg-grid-outline-w', `${Math.max(0, dbgGridOutlineW)}px`);
    root.style.setProperty('--dbg-cell-outline-w', `${Math.max(0, dbgCellOutlineW)}px`);
    root.style.setProperty('--dbg-disabled-outline-w', `${Math.max(0, dbgDisabledOutlineW)}px`);
    root.style.setProperty('--dbg-clickable-outline-w', `${Math.max(0, dbgClickableOutlineW)}px`);
  }, [dbgGridOutlineW, dbgCellOutlineW, dbgDisabledOutlineW, dbgClickableOutlineW]);

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
    hiddenKeys,
    setHiddenKeys,
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
    // Geometry
    scale,
    setScale,
    boardWidthFactor,
    setBoardWidthFactor,
    boardOffsetX,
    setBoardOffsetX,
    boardOffsetYBase,
    setBoardOffsetYBase,
    gridOffsetExtraX,
    setGridOffsetExtraX,
    gridOffsetExtraY,
    setGridOffsetExtraY,
    levelGapBase,
    setLevelGapBase,
    cellSizeMin,
    setCellSizeMin,
    cellSizeMult,
    setCellSizeMult,
    overlayNudgeX,
    setOverlayNudgeX,
    boardTopGap,
    setBoardTopGap,
    boardActionsGap,
    setBoardActionsGap,
    // Holes/Balls
    holeScale,
    setHoleScale,
    ballMatrixScale,
    setBallMatrixScale,
    holeMatrixScale,
    setHoleMatrixScale,
    holeRingW,
    setHoleRingW,
    holeInset,
    setHoleInset,
    // Debug
    debugHitTest,
    setDebugHitTest,
    debugShowGrid,
    setDebugShowGrid,
    debugShowOverlays,
    setDebugShowOverlays,
    debugShowCellOutlines,
    setDebugShowCellOutlines,
    debugShowDisabledCells,
    setDebugShowDisabledCells,
    debugShowClickable,
    setDebugShowClickable,
    // Debug sizes
    dbgGridOutlineW,
    setDbgGridOutlineW,
    dbgCellOutlineW,
    setDbgCellOutlineW,
    dbgDisabledOutlineW,
    setDbgDisabledOutlineW,
    dbgClickableOutlineW,
    setDbgClickableOutlineW,
  };
}

