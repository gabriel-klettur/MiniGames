import { useState } from 'react';
import UXPanelHeader from './components/UXPanelHeader';
import ShadeTab from './components/tabs/ShadeTab';
import SizeTab from './components/tabs/SizeTab';
import AnimTab from './components/tabs/AnimTab';
import LayoutTab from './components/tabs/LayoutTab';
import HolesTab from './components/tabs/HolesTab';
import DebugTab from './components/tabs/DebugTab';
import { buildConfig, applyConfig } from './utils/config';
import { saveJson, loadJsonFromFile } from './utils/fileIO';

export interface UXPanelProps {
  // Shading toggles per level
  noShadeL0: boolean;
  noShadeL1: boolean;
  noShadeL2: boolean;
  noShadeL3: boolean;
  onChangeNoShade: (level: 0 | 1 | 2 | 3, value: boolean) => void;
  // Auto mode: only shade available levels
  shadeOnlyAvailable: boolean;
  onToggleShadeOnlyAvailable: (v: boolean) => void;
  // Shade only supported (available) holes per cell
  shadeOnlyHoles: boolean;
  onToggleShadeOnlyHoles: (v: boolean) => void;
  // Show white borders on available holes
  holeBorders: boolean;
  onToggleHoleBorders: (v: boolean) => void;
  // Piece scale (only ball size, not board scale)
  pieceScale: number; // e.g., 1.55
  onChangePieceScale: (v: number) => void;
  // Animation durations in ms
  appearMs: number; // piece appear
  flashMs: number;  // cell flash
  flyMs: number;    // flying piece
  onChangeAppearMs: (ms: number) => void;
  onChangeFlashMs: (ms: number) => void;
  onChangeFlyMs: (ms: number) => void;
  // Delay between auto-placement steps (ms)
  autoFillDelayMs: number;
  onChangeAutoFillDelayMs: (ms: number) => void;

  // Layout / Board geometry
  scale: number;
  onChangeScale: (v: number) => void;
  boardWidthFactor: number;
  onChangeBoardWidthFactor: (v: number) => void;
  boardOffsetX: number;
  onChangeBoardOffsetX: (v: number) => void;
  boardOffsetYBase: number;
  onChangeBoardOffsetYBase: (v: number) => void;
  gridOffsetExtraX: number;
  onChangeGridOffsetExtraX: (v: number) => void;
  gridOffsetExtraY: number;
  onChangeGridOffsetExtraY: (v: number) => void;
  levelGapBase: number;
  onChangeLevelGapBase: (v: number) => void;
  cellSizeMin: number;
  onChangeCellSizeMin: (v: number) => void;
  cellSizeMult: number;
  onChangeCellSizeMult: (v: number) => void;
  overlayNudgeX: number;
  onChangeOverlayNudgeX: (v: number) => void;
  boardTopGap: number;
  onChangeBoardTopGap: (v: number) => void;
  boardActionsGap: number;
  onChangeBoardActionsGap: (v: number) => void;

  // Holes / Balls visuals
  holeScale: number;
  onChangeHoleScale: (v: number) => void;
  ballMatrixScale: number;
  onChangeBallMatrixScale: (v: number) => void;
  holeMatrixScale: number;
  onChangeHoleMatrixScale: (v: number) => void;
  holeRingW: number;
  onChangeHoleRingW: (v: number) => void;
  holeInset: number;
  onChangeHoleInset: (v: number) => void;

  // Debug
  debugHitTest: boolean;
  onToggleDebugHitTest: (v: boolean) => void;
  // Fine-grained debug toggles
  debugShowGrid: boolean;
  onToggleDebugShowGrid: (v: boolean) => void;
  debugShowOverlays: boolean;
  onToggleDebugShowOverlays: (v: boolean) => void;
  debugShowCellOutlines: boolean;
  onToggleDebugShowCellOutlines: (v: boolean) => void;
  debugShowDisabledCells: boolean;
  onToggleDebugShowDisabledCells: (v: boolean) => void;
  debugShowClickable: boolean;
  onToggleDebugShowClickable: (v: boolean) => void;
  // Debug sizes (px)
  dbgGridOutlineW: number;
  onChangeDbgGridOutlineW: (v: number) => void;
  dbgCellOutlineW: number;
  onChangeDbgCellOutlineW: (v: number) => void;
  dbgDisabledOutlineW: number;
  onChangeDbgDisabledOutlineW: (v: number) => void;
  dbgClickableOutlineW: number;
  onChangeDbgClickableOutlineW: (v: number) => void;
}

/**
 * UXPanel: ajustes visuales de UI/UX
 * - Sombreado por nivel (L0..L3)
 * - Tamaño de la bola (escala)
 * - Duraciones de animación (input numérico en ms)
 */
export default function UXPanel(props: UXPanelProps) {
  const {
    noShadeL0, noShadeL1, noShadeL2, noShadeL3,
    onChangeNoShade,
    shadeOnlyAvailable, onToggleShadeOnlyAvailable,
    shadeOnlyHoles, onToggleShadeOnlyHoles,
    holeBorders, onToggleHoleBorders,
    pieceScale, onChangePieceScale,
    appearMs, flashMs, flyMs,
    onChangeAppearMs, onChangeFlashMs, onChangeFlyMs,
    autoFillDelayMs, onChangeAutoFillDelayMs,
    // Layout
    scale, onChangeScale,
    boardWidthFactor, onChangeBoardWidthFactor,
    boardOffsetX, onChangeBoardOffsetX,
    boardOffsetYBase, onChangeBoardOffsetYBase,
    gridOffsetExtraX, onChangeGridOffsetExtraX,
    gridOffsetExtraY, onChangeGridOffsetExtraY,
    levelGapBase, onChangeLevelGapBase,
    cellSizeMin, onChangeCellSizeMin,
    cellSizeMult, onChangeCellSizeMult,
    overlayNudgeX, onChangeOverlayNudgeX,
    boardTopGap, onChangeBoardTopGap,
    boardActionsGap, onChangeBoardActionsGap,
    // Holes/Balls
    holeScale, onChangeHoleScale,
    ballMatrixScale, onChangeBallMatrixScale,
    holeMatrixScale, onChangeHoleMatrixScale,
    holeRingW, onChangeHoleRingW,
    holeInset, onChangeHoleInset,
    // Debug
    debugHitTest, onToggleDebugHitTest,
    debugShowGrid, onToggleDebugShowGrid,
    debugShowOverlays, onToggleDebugShowOverlays,
    debugShowCellOutlines, onToggleDebugShowCellOutlines,
    debugShowDisabledCells, onToggleDebugShowDisabledCells,
    debugShowClickable, onToggleDebugShowClickable,
    dbgGridOutlineW, onChangeDbgGridOutlineW,
    dbgCellOutlineW, onChangeDbgCellOutlineW,
    dbgDisabledOutlineW, onChangeDbgDisabledOutlineW,
    dbgClickableOutlineW, onChangeDbgClickableOutlineW,
  } = props;

  const [tab, setTab] = useState<'shade' | 'size' | 'anim' | 'layout' | 'holes' | 'debug'>('shade');

  const onKeyNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const order: Array<typeof tab> = ['shade', 'size', 'anim', 'layout', 'holes', 'debug'];
    const idx = order.indexOf(tab);
    const next = e.key === 'ArrowRight' ? (idx + 1) % order.length : (idx - 1 + order.length) % order.length;
    setTab(order[next]);
  };
  // Snapshot of current values (for export/apply)
  const current = () => ({
    shading: {
      shadeOnlyAvailable,
      shadeOnlyHoles,
      holeBorders,
      noShade: { 0: noShadeL0, 1: noShadeL1, 2: noShadeL2, 3: noShadeL3 } as const,
    },
    size: { pieceScale },
    anim: { appearMs, flashMs, flyMs, autoFillDelayMs },
    layout: {
      scale,
      boardWidthFactor,
      boardOffsetX,
      boardOffsetYBase,
      gridOffsetExtraX,
      gridOffsetExtraY,
      levelGapBase,
      cellSizeMin,
      cellSizeMult,
      overlayNudgeX,
      boardTopGap,
      boardActionsGap,
    },
    holes: { holeScale, ballMatrixScale, holeMatrixScale, holeRingW, holeInset },
    debug: {
      debugHitTest,
      showGrid: debugShowGrid,
      showOverlays: debugShowOverlays,
      showCellOutlines: debugShowCellOutlines,
      showDisabledCells: debugShowDisabledCells,
      showClickable: debugShowClickable,
      gridOutlineW: dbgGridOutlineW,
      cellOutlineW: dbgCellOutlineW,
      disabledOutlineW: dbgDisabledOutlineW,
      clickableOutlineW: dbgClickableOutlineW,
    },
  });

  const appliers = {
    onToggleShadeOnlyAvailable,
    onToggleShadeOnlyHoles,
    onToggleHoleBorders,
    onChangeNoShade,
    onChangePieceScale,
    onChangeAppearMs,
    onChangeFlashMs,
    onChangeFlyMs,
    onChangeAutoFillDelayMs,
    onChangeScale,
    onChangeBoardWidthFactor,
    onChangeBoardOffsetX,
    onChangeBoardOffsetYBase,
    onChangeGridOffsetExtraX,
    onChangeGridOffsetExtraY,
    onChangeLevelGapBase,
    onChangeCellSizeMin,
    onChangeCellSizeMult,
    onChangeOverlayNudgeX,
    onChangeBoardTopGap,
    onChangeBoardActionsGap,
    onChangeHoleScale,
    onChangeBallMatrixScale,
    onChangeHoleMatrixScale,
    onChangeHoleRingW,
    onChangeHoleInset,
    onToggleDebugHitTest,
    onToggleDebugShowGrid,
    onToggleDebugShowOverlays,
    onToggleDebugShowCellOutlines,
    onToggleDebugShowDisabledCells,
    onToggleDebugShowClickable,
    onChangeDbgGridOutlineW,
    onChangeDbgCellOutlineW,
    onChangeDbgDisabledOutlineW,
    onChangeDbgClickableOutlineW,
  } as const;

  const handleSave = () => {
    try {
      const cfg = buildConfig(current() as any);
      saveJson('pylos-ux-config', cfg);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Save UX config error:', err);
      window.alert('Error al guardar configuración UI/UX.');
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      const json = await loadJsonFromFile(file);
      applyConfig(json, current() as any, appliers as any);
      window.alert('Configuración UI/UX cargada.');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Load UX config error:', err);
      window.alert('JSON inválido o incompatible.');
    }
  };

  return (
    <div className="ux-panel">
      <UXPanelHeader title="Opciones UI/UX" onRequestSave={handleSave} onFileSelected={handleFileSelected} />

      {/* Tabs header */}
      <div className="tabs" onKeyDown={onKeyNav}>
        <div className="tabs__list" role="tablist" aria-label="Configuración UI/UX">
          <button
            role="tab"
            id="tab-shade"
            aria-controls="panel-shade"
            aria-selected={tab === 'shade'}
            tabIndex={tab === 'shade' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('shade')}
          >Sombreado</button>
          <button
            role="tab"
            id="tab-size"
            aria-controls="panel-size"
            aria-selected={tab === 'size'}
            tabIndex={tab === 'size' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('size')}
          >Tamaño</button>
          <button
            role="tab"
            id="tab-anim"
            aria-controls="panel-anim"
            aria-selected={tab === 'anim'}
            tabIndex={tab === 'anim' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('anim')}
          >Animaciones</button>
          <button
            role="tab"
            id="tab-layout"
            aria-controls="panel-layout"
            aria-selected={tab === 'layout'}
            tabIndex={tab === 'layout' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('layout')}
          >Tablero</button>
          <button
            role="tab"
            id="tab-holes"
            aria-controls="panel-holes"
            aria-selected={tab === 'holes'}
            tabIndex={tab === 'holes' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('holes')}
          >Huecos/Bolas</button>
          <button
            role="tab"
            id="tab-debug"
            aria-controls="panel-debug"
            aria-selected={tab === 'debug'}
            tabIndex={tab === 'debug' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('debug')}
          >Depuración</button>
        </div>
      </div>

      {/* Tab panels */}
      {tab === 'shade' && (
        <ShadeTab
          shadeOnlyAvailable={shadeOnlyAvailable}
          onToggleShadeOnlyAvailable={onToggleShadeOnlyAvailable}
          shadeOnlyHoles={shadeOnlyHoles}
          onToggleShadeOnlyHoles={onToggleShadeOnlyHoles}
          holeBorders={holeBorders}
          onToggleHoleBorders={onToggleHoleBorders}
          noShadeL0={noShadeL0}
          noShadeL1={noShadeL1}
          noShadeL2={noShadeL2}
          noShadeL3={noShadeL3}
          onChangeNoShade={onChangeNoShade}
        />
      )}

      {tab === 'size' && (
        <SizeTab
          // Pieces
          pieceScale={pieceScale}
          onChangePieceScale={onChangePieceScale}
          // Board & Cells
          scale={scale}
          onChangeScale={onChangeScale}
          cellSizeMin={cellSizeMin}
          onChangeCellSizeMin={onChangeCellSizeMin}
          cellSizeMult={cellSizeMult}
          onChangeCellSizeMult={onChangeCellSizeMult}
          levelGapBase={levelGapBase}
          onChangeLevelGapBase={onChangeLevelGapBase}
          // Holes
          holeScale={holeScale}
          onChangeHoleScale={onChangeHoleScale}
          ballMatrixScale={ballMatrixScale}
          onChangeBallMatrixScale={onChangeBallMatrixScale}
          holeMatrixScale={holeMatrixScale}
          onChangeHoleMatrixScale={onChangeHoleMatrixScale}
          holeRingW={holeRingW}
          onChangeHoleRingW={onChangeHoleRingW}
          holeInset={holeInset}
          onChangeHoleInset={onChangeHoleInset}
          // Debug outline widths
          dbgGridOutlineW={dbgGridOutlineW}
          onChangeDbgGridOutlineW={onChangeDbgGridOutlineW}
          dbgCellOutlineW={dbgCellOutlineW}
          onChangeDbgCellOutlineW={onChangeDbgCellOutlineW}
          dbgDisabledOutlineW={dbgDisabledOutlineW}
          onChangeDbgDisabledOutlineW={onChangeDbgDisabledOutlineW}
          dbgClickableOutlineW={dbgClickableOutlineW}
          onChangeDbgClickableOutlineW={onChangeDbgClickableOutlineW}
        />
      )}

      {tab === 'anim' && (
        <AnimTab
          appearMs={appearMs}
          flashMs={flashMs}
          flyMs={flyMs}
          autoFillDelayMs={autoFillDelayMs}
          onChangeAppearMs={onChangeAppearMs}
          onChangeFlashMs={onChangeFlashMs}
          onChangeFlyMs={onChangeFlyMs}
          onChangeAutoFillDelayMs={onChangeAutoFillDelayMs}
        />
      )}

      {tab === 'layout' && (
        <LayoutTab
          scale={scale}
          onChangeScale={onChangeScale}
          boardWidthFactor={boardWidthFactor}
          onChangeBoardWidthFactor={onChangeBoardWidthFactor}
          boardOffsetX={boardOffsetX}
          onChangeBoardOffsetX={onChangeBoardOffsetX}
          boardOffsetYBase={boardOffsetYBase}
          onChangeBoardOffsetYBase={onChangeBoardOffsetYBase}
          gridOffsetExtraX={gridOffsetExtraX}
          onChangeGridOffsetExtraX={onChangeGridOffsetExtraX}
          gridOffsetExtraY={gridOffsetExtraY}
          onChangeGridOffsetExtraY={onChangeGridOffsetExtraY}
          levelGapBase={levelGapBase}
          onChangeLevelGapBase={onChangeLevelGapBase}
          cellSizeMin={cellSizeMin}
          onChangeCellSizeMin={onChangeCellSizeMin}
          cellSizeMult={cellSizeMult}
          onChangeCellSizeMult={onChangeCellSizeMult}
          overlayNudgeX={overlayNudgeX}
          onChangeOverlayNudgeX={onChangeOverlayNudgeX}
          boardTopGap={boardTopGap}
          onChangeBoardTopGap={onChangeBoardTopGap}
          boardActionsGap={boardActionsGap}
          onChangeBoardActionsGap={onChangeBoardActionsGap}
        />
      )}

      {tab === 'holes' && (
        <HolesTab
          holeScale={holeScale}
          onChangeHoleScale={onChangeHoleScale}
          ballMatrixScale={ballMatrixScale}
          onChangeBallMatrixScale={onChangeBallMatrixScale}
          holeMatrixScale={holeMatrixScale}
          onChangeHoleMatrixScale={onChangeHoleMatrixScale}
          holeRingW={holeRingW}
          onChangeHoleRingW={onChangeHoleRingW}
          holeInset={holeInset}
          onChangeHoleInset={onChangeHoleInset}
        />
      )}

      {tab === 'debug' && (
        <DebugTab
          debugHitTest={debugHitTest}
          onToggleDebugHitTest={onToggleDebugHitTest}
          debugShowGrid={debugShowGrid}
          onToggleDebugShowGrid={onToggleDebugShowGrid}
          debugShowOverlays={debugShowOverlays}
          onToggleDebugShowOverlays={onToggleDebugShowOverlays}
          debugShowCellOutlines={debugShowCellOutlines}
          onToggleDebugShowCellOutlines={onToggleDebugShowCellOutlines}
          debugShowDisabledCells={debugShowDisabledCells}
          onToggleDebugShowDisabledCells={onToggleDebugShowDisabledCells}
          debugShowClickable={debugShowClickable}
          onToggleDebugShowClickable={onToggleDebugShowClickable}
          dbgGridOutlineW={dbgGridOutlineW}
          onChangeDbgGridOutlineW={onChangeDbgGridOutlineW}
          dbgCellOutlineW={dbgCellOutlineW}
          onChangeDbgCellOutlineW={onChangeDbgCellOutlineW}
          dbgDisabledOutlineW={dbgDisabledOutlineW}
          onChangeDbgDisabledOutlineW={onChangeDbgDisabledOutlineW}
          dbgClickableOutlineW={dbgClickableOutlineW}
          onChangeDbgClickableOutlineW={onChangeDbgClickableOutlineW}
        />
      )}
    </div>
  );
}
