import type { UXConfig, ShadeLevels } from '../types/uxConfig';
import { coerceBool, coerceNum } from './coerce';

export interface UXCurrent {
  shading: {
    shadeOnlyAvailable: boolean;
    shadeOnlyHoles: boolean;
    holeBorders: boolean;
    noShade: ShadeLevels;
  };
  size: { pieceScale: number };
  anim: { appearMs: number; flashMs: number; flyMs: number; autoFillDelayMs: number };
  layout: {
    scale: number; boardWidthFactor: number; boardOffsetX: number; boardOffsetYBase: number;
    gridOffsetExtraX: number; gridOffsetExtraY: number; levelGapBase: number; cellSizeMin: number;
    cellSizeMult: number; overlayNudgeX: number; boardTopGap: number; boardActionsGap: number;
  };
  holes: { holeScale: number; ballMatrixScale: number; holeMatrixScale: number; holeRingW: number; holeInset: number };
  debug: {
    debugHitTest: boolean;
    showGrid: boolean;
    showOverlays: boolean;
    showCellOutlines: boolean;
    showDisabledCells: boolean;
    showClickable: boolean;
    gridOutlineW: number;
    cellOutlineW: number;
    disabledOutlineW: number;
    clickableOutlineW: number;
  };
}

export interface UXAppliers {
  onToggleShadeOnlyAvailable: (v: boolean) => void;
  onToggleShadeOnlyHoles: (v: boolean) => void;
  onToggleHoleBorders: (v: boolean) => void;
  onChangeNoShade: (level: 0 | 1 | 2 | 3, value: boolean) => void;

  onChangePieceScale: (v: number) => void;
  onChangeAppearMs: (v: number) => void;
  onChangeFlashMs: (v: number) => void;
  onChangeFlyMs: (v: number) => void;
  onChangeAutoFillDelayMs: (v: number) => void;

  onChangeScale: (v: number) => void;
  onChangeBoardWidthFactor: (v: number) => void;
  onChangeBoardOffsetX: (v: number) => void;
  onChangeBoardOffsetYBase: (v: number) => void;
  onChangeGridOffsetExtraX: (v: number) => void;
  onChangeGridOffsetExtraY: (v: number) => void;
  onChangeLevelGapBase: (v: number) => void;
  onChangeCellSizeMin: (v: number) => void;
  onChangeCellSizeMult: (v: number) => void;
  onChangeOverlayNudgeX: (v: number) => void;
  onChangeBoardTopGap: (v: number) => void;
  onChangeBoardActionsGap: (v: number) => void;

  onChangeHoleScale: (v: number) => void;
  onChangeBallMatrixScale: (v: number) => void;
  onChangeHoleMatrixScale: (v: number) => void;
  onChangeHoleRingW: (v: number) => void;
  onChangeHoleInset: (v: number) => void;

  onToggleDebugHitTest: (v: boolean) => void;
  onToggleDebugShowGrid: (v: boolean) => void;
  onToggleDebugShowOverlays: (v: boolean) => void;
  onToggleDebugShowCellOutlines: (v: boolean) => void;
  onToggleDebugShowDisabledCells: (v: boolean) => void;
  onToggleDebugShowClickable: (v: boolean) => void;
  onChangeDbgGridOutlineW: (v: number) => void;
  onChangeDbgCellOutlineW: (v: number) => void;
  onChangeDbgDisabledOutlineW: (v: number) => void;
  onChangeDbgClickableOutlineW: (v: number) => void;
}

export function buildConfig(current: UXCurrent): UXConfig {
  return {
    version: 1,
    shading: { ...current.shading },
    size: { ...current.size },
    anim: { ...current.anim },
    layout: { ...current.layout },
    holes: { ...current.holes },
    debug: { ...current.debug },
  };
}

export function applyConfig(cfg: any, current: UXCurrent, appliers: UXAppliers): void {
  const shading = cfg?.shading ?? cfg ?? {};
  const size = cfg?.size ?? cfg ?? {};
  const anim = cfg?.anim ?? cfg ?? {};
  const layout = cfg?.layout ?? {};
  const holes = cfg?.holes ?? {};
  const debug = cfg?.debug ?? {};

  appliers.onToggleShadeOnlyAvailable(coerceBool(shading.shadeOnlyAvailable, current.shading.shadeOnlyAvailable));
  appliers.onToggleShadeOnlyHoles(coerceBool(shading.shadeOnlyHoles, current.shading.shadeOnlyHoles));
  appliers.onToggleHoleBorders(coerceBool(shading.holeBorders, current.shading.holeBorders));

  const ns = (shading.noShade ?? {}) as Partial<ShadeLevels>;
  ([(0 as const), (1 as const), (2 as const), (3 as const)]).forEach((lvl) => {
    const next = coerceBool(ns?.[lvl], current.shading.noShade[lvl]);
    appliers.onChangeNoShade(lvl, next);
  });

  appliers.onChangePieceScale(coerceNum(size.pieceScale, current.size.pieceScale, 0.8, 2.5));
  appliers.onChangeAppearMs(coerceNum(anim.appearMs, current.anim.appearMs, 0, 6000));
  appliers.onChangeFlashMs(coerceNum(anim.flashMs, current.anim.flashMs, 0, 10000));
  appliers.onChangeFlyMs(coerceNum(anim.flyMs, current.anim.flyMs, 0, 10000));
  appliers.onChangeAutoFillDelayMs(coerceNum(anim.autoFillDelayMs, current.anim.autoFillDelayMs, 0, 5000));

  appliers.onChangeScale(coerceNum(layout.scale, current.layout.scale, 0.3, 2.0));
  appliers.onChangeBoardWidthFactor(coerceNum(layout.boardWidthFactor, current.layout.boardWidthFactor, 0.5, 1.25));
  appliers.onChangeBoardOffsetX(coerceNum(layout.boardOffsetX, current.layout.boardOffsetX, -400, 400));
  appliers.onChangeBoardOffsetYBase(coerceNum(layout.boardOffsetYBase, current.layout.boardOffsetYBase, -400, 400));
  appliers.onChangeGridOffsetExtraX(coerceNum(layout.gridOffsetExtraX, current.layout.gridOffsetExtraX, -400, 400));
  appliers.onChangeGridOffsetExtraY(coerceNum(layout.gridOffsetExtraY, current.layout.gridOffsetExtraY, -400, 400));
  appliers.onChangeLevelGapBase(coerceNum(layout.levelGapBase, current.layout.levelGapBase, 0, 40));
  appliers.onChangeCellSizeMin(coerceNum(layout.cellSizeMin, current.layout.cellSizeMin, 16, 200));
  appliers.onChangeCellSizeMult(coerceNum(layout.cellSizeMult, current.layout.cellSizeMult, 0.5, 2));
  appliers.onChangeOverlayNudgeX(coerceNum(layout.overlayNudgeX, current.layout.overlayNudgeX, -100, 100));
  appliers.onChangeBoardTopGap(coerceNum(layout.boardTopGap, current.layout.boardTopGap, -200, 200));
  appliers.onChangeBoardActionsGap(coerceNum(layout.boardActionsGap, current.layout.boardActionsGap, -200, 200));

  appliers.onChangeHoleScale(coerceNum(holes.holeScale, current.holes.holeScale, 0.5, 1.6));
  appliers.onChangeBallMatrixScale(coerceNum(holes.ballMatrixScale, current.holes.ballMatrixScale, 0.6, 1.6));
  appliers.onChangeHoleMatrixScale(coerceNum(holes.holeMatrixScale, current.holes.holeMatrixScale, 0.6, 1.6));
  appliers.onChangeHoleRingW(coerceNum(holes.holeRingW, current.holes.holeRingW, 0, 10));
  appliers.onChangeHoleInset(coerceNum(holes.holeInset, current.holes.holeInset, 0, 12));

  appliers.onToggleDebugHitTest(coerceBool(debug.debugHitTest, current.debug.debugHitTest));
  appliers.onToggleDebugShowGrid(coerceBool(debug.showGrid, current.debug.showGrid));
  appliers.onToggleDebugShowOverlays(coerceBool(debug.showOverlays, current.debug.showOverlays));
  appliers.onToggleDebugShowCellOutlines(coerceBool(debug.showCellOutlines, current.debug.showCellOutlines));
  appliers.onToggleDebugShowDisabledCells(coerceBool(debug.showDisabledCells, current.debug.showDisabledCells));
  appliers.onToggleDebugShowClickable(coerceBool(debug.showClickable, current.debug.showClickable));
  // Sizes (px) with sane bounds 0..12
  appliers.onChangeDbgGridOutlineW(coerceNum(debug.gridOutlineW, current.debug.gridOutlineW, 0, 12));
  appliers.onChangeDbgCellOutlineW(coerceNum(debug.cellOutlineW, current.debug.cellOutlineW, 0, 12));
  appliers.onChangeDbgDisabledOutlineW(coerceNum(debug.disabledOutlineW, current.debug.disabledOutlineW, 0, 12));
  appliers.onChangeDbgClickableOutlineW(coerceNum(debug.clickableOutlineW, current.debug.clickableOutlineW, 0, 12));
}
