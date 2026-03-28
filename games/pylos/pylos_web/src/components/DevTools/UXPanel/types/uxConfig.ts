export type ShadeLevels = { 0: boolean; 1: boolean; 2: boolean; 3: boolean };

export interface UXConfig {
  version: 1;
  shading: {
    shadeOnlyAvailable: boolean;
    shadeOnlyHoles: boolean;
    holeBorders: boolean;
    noShade: ShadeLevels;
  };
  size: { pieceScale: number };
  anim: {
    appearMs: number;
    flashMs: number;
    flyMs: number;
    autoFillDelayMs: number;
  };
  layout: {
    scale: number;
    boardWidthFactor: number;
    boardOffsetX: number;
    boardOffsetYBase: number;
    gridOffsetExtraX: number;
    gridOffsetExtraY: number;
    levelGapBase: number;
    cellSizeMin: number;
    cellSizeMult: number;
    overlayNudgeX: number;
    boardTopGap: number;
    boardActionsGap: number;
  };
  holes: {
    holeScale: number;
    ballMatrixScale: number;
    holeMatrixScale: number;
    holeRingW: number;
    holeInset: number;
  };
  debug: {
    debugHitTest: boolean;
    showGrid: boolean;
    showOverlays: boolean;
    showCellOutlines: boolean;
    showDisabledCells: boolean;
    showClickable: boolean;
    // Outline widths (px)
    gridOutlineW: number;
    cellOutlineW: number;
    disabledOutlineW: number;
    clickableOutlineW: number;
  };
}
