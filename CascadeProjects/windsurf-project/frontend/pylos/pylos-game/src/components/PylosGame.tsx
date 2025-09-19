import React, { useEffect, useState } from 'react';
import PylosBoard from './PylosBoard';
import type { Cell } from '../game/types';
import Controls from './Panels/Controls';
import ConfigPanel from './Panels/ConfigPanel';
import StatusBar from './Panels/StatusBar';
import InfoPanel from './Panels/InfoPanel';
import { usePylosGame } from '../hooks/usePylosGame';

// Defaults definidos en código ("de fábrica").
// Edita estos valores para cambiar el estado inicial y el objetivo de "Restablecer a fábrica".
const CODE_DEFAULTS = {
  cellSize: 48,
  gapSize: 6,
  gridX: 0,
  gridY: 0,
  gridGapX: 6,
  gridGapY: 6,
  holeSize: Math.round(48 * 0.82),
  ballSize: Math.round(48 * 0.9),
};

const PylosGame: React.FC = () => {
  const { state, place, climb, remove, finishRemoval, reset, setExpertMode: applyExpertMode, statusText, canFinishRemoval, reserves } = usePylosGame(true);
  const [selectedSrc, setSelectedSrc] = useState<Cell | null>(null);
  const [expertMode, setExpertMode] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showHoles, setShowHoles] = useState<boolean>(false);
  const [showIndices, setShowIndices] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  // Board scaling (CSS variables consumed by PylosBoard)
  const [cellSize, setCellSize] = useState<number>(CODE_DEFAULTS.cellSize);
  const [gapSize, setGapSize] = useState<number>(CODE_DEFAULTS.gapSize);
  const [holeSize, setHoleSize] = useState<number>(CODE_DEFAULTS.holeSize);
  const [ballSize, setBallSize] = useState<number>(CODE_DEFAULTS.ballSize);
  // Grid calibration (position + independent gaps; hole size remains constant)
  const [gridX, setGridX] = useState<number>(CODE_DEFAULTS.gridX);
  const [gridY, setGridY] = useState<number>(CODE_DEFAULTS.gridY);
  const [gridGapX, setGridGapX] = useState<number>(CODE_DEFAULTS.gridGapX);
  const [gridGapY, setGridGapY] = useState<number>(CODE_DEFAULTS.gridGapY);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Sincroniza la regla de retirada con el modo experto a través del hook controlador
  useEffect(() => {
    applyExpertMode(expertMode);
  }, [expertMode, applyExpertMode]);

  // Nota: sin clamps: el tamaño de hueco y de bola son independientes del cellSize

  // --- Persistencia en localStorage ---
  const STORAGE_KEY = 'pylos_config_v1';

  // Carga inicial
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cfg = JSON.parse(raw) as Partial<{
        cellSize: number; gapSize: number; gridX: number; gridY: number; gridGapX: number; gridGapY: number; holeSize: number; ballSize: number;
      }>;
      if (typeof cfg.cellSize === 'number') setCellSize(cfg.cellSize);
      if (typeof cfg.gapSize === 'number') setGapSize(cfg.gapSize);
      if (typeof cfg.gridX === 'number') setGridX(cfg.gridX);
      if (typeof cfg.gridY === 'number') setGridY(cfg.gridY);
      if (typeof cfg.gridGapX === 'number') setGridGapX(cfg.gridGapX);
      if (typeof cfg.gridGapY === 'number') setGridGapY(cfg.gridGapY);
      if (typeof cfg.holeSize === 'number') setHoleSize(cfg.holeSize);
      if (typeof cfg.ballSize === 'number') setBallSize(cfg.ballSize);
    } catch (e) {
      console.warn('No se pudo cargar configuración de Pylos desde localStorage:', e);
    } finally {
      // marcar como hidratado aunque no exista configuración para evitar overwrite de guardado inicial
      setIsHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardado reactivo
  useEffect(() => {
    if (!isHydrated) return; // esperar a la carga inicial antes de guardar
    try {
      const cfg = { cellSize, gapSize, gridX, gridY, gridGapX, gridGapY, holeSize, ballSize };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('No se pudo guardar configuración de Pylos en localStorage:', e);
    }
  }, [isHydrated, cellSize, gapSize, gridX, gridY, gridGapX, gridGapY, holeSize, ballSize]);

  const handleCellClick = (cell: Cell) => {
    if (state.phase === 'ENDED') return;

    if (state.subphase === 'REMOVAL') {
      remove(cell);
      return;
    }

    // ACTION subphase
    const owner = state.board.get(cell);
    const isOwn = owner === state.currentPlayer;
    const isFree = isOwn && state.board.isFree(cell);

    // 1) Click own free marble -> select/deselect as src
    if (isFree) {
      setSelectedSrc((prev) => (prev && prev.layer === cell.layer && prev.x === cell.x && prev.y === cell.y ? null : cell));
      return;
    }

    // 2) If a src is selected and clicking a destination -> attempt climb
    if (selectedSrc) {
      const src = selectedSrc;
      const dst = cell;
      // Intentar trepar vía acción del hook
      climb(src, dst);
      setSelectedSrc(null);
      return;
    }

    // 3) Otherwise, try placement
    place(cell);
    setSelectedSrc(null);
  };

  const resetGame = () => {
    setSelectedSrc(null);
    reset(expertMode);
  };

  const toggleMode = () => setExpertMode((v: boolean) => !v);
  const toggleInfo = () => setShowInfo((v) => !v);
  const toggleHoles = () => setShowHoles((v) => !v);
  const toggleIndices = () => setShowIndices((v) => !v);
  const toggleConfig = () => setShowConfig((v) => !v);

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <h1>Pylos (Web, React + TS)</h1>
      <Controls
        expertMode={expertMode}
        showInfo={showInfo}
        showHoles={showHoles}
        showIndices={showIndices}
        showConfig={showConfig}
        onReset={resetGame}
        onToggleMode={toggleMode}
        onToggleInfo={toggleInfo}
        onToggleHoles={toggleHoles}
        onToggleIndices={toggleIndices}
        onToggleConfig={toggleConfig}
      />
      {showConfig && (
        <ConfigPanel
          cellSize={cellSize}
          gapSize={gapSize}
          gridX={gridX}
          gridY={gridY}
          gridGapX={gridGapX}
          gridGapY={gridGapY}
          holeSize={holeSize}
          ballSize={ballSize}
          onChangeCell={(v) => setCellSize(v)}
          onChangeGap={(v) => { setGapSize(v); /* opcional: sincronizar gaps del grid si coinciden */ }}
          onChangeGridX={(v) => setGridX(v)}
          onChangeGridY={(v) => setGridY(v)}
          onChangeGridGapX={(v) => setGridGapX(v)}
          onChangeGridGapY={(v) => setGridGapY(v)}
          onChangeHole={(v) => setHoleSize(v)}
          onChangeBall={(v) => setBallSize(v)}
          onReset={() => {
            setCellSize(48); setGapSize(6); setGridX(0); setGridY(0); setGridGapX(6); setGridGapY(6); setHoleSize(Math.round(48 * 0.82)); setBallSize(Math.round(48 * 0.9));
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
          }}
        />
      )}
      <PylosBoard
        board={state.board}
        currentPlayer={state.currentPlayer}
        subphase={state.subphase}
        selectedSrc={selectedSrc}
        onCellClick={handleCellClick}
        onFinishRemoval={() => finishRemoval()}
        canFinishRemoval={canFinishRemoval}
        showHoles={showHoles}
        showIndices={showIndices}
        cellSize={cellSize}
        gapSize={gapSize}
        configMode={showConfig}
        onResize={(nextCell, nextGap) => { setCellSize(nextCell); setGapSize(nextGap); }}
        gridX={gridX}
        gridY={gridY}
        gridGapX={gridGapX}
        gridGapY={gridGapY}
        onGridMove={(x, y) => { setGridX(x); setGridY(y); }}
        onGridResize={(gx, gy) => { setGridGapX(gx); setGridGapY(gy); }}
        holeSize={holeSize}
        ballSize={ballSize}
      />
      <StatusBar text={statusText} />
      {showInfo && (
        <InfoPanel
          currentPlayer={state.currentPlayer}
          subphase={state.subphase}
          p1Reserve={reserves.p1}
          p2Reserve={reserves.p2}
          removalsAllowed={state.removalsAllowed}
          removalsTaken={state.removalsTaken}
        />
      )}
    </div>
  );
};

export default PylosGame;
