import React, { useEffect, useState } from 'react';
import PylosBoard from './PylosBoard';
import type { Cell } from '../game/types';
import Controls from './Panels/Controls';
import ConfigPanel from './Panels/ConfigPanel';
import StatusBar from './Panels/StatusBar';
import InfoPanel from './Panels/InfoPanel';
import { usePylosGame } from '../hooks/usePylosGame';

const PylosGame: React.FC = () => {
  const { state, place, climb, remove, finishRemoval, reset, setExpertMode: applyExpertMode, statusText, canFinishRemoval, reserves } = usePylosGame(true);
  const [selectedSrc, setSelectedSrc] = useState<Cell | null>(null);
  const [expertMode, setExpertMode] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showHoles, setShowHoles] = useState<boolean>(false);
  const [showIndices, setShowIndices] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  // Board scaling (CSS variables consumed by PylosBoard)
  const [cellSize, setCellSize] = useState<number>(48);
  const [gapSize, setGapSize] = useState<number>(6);

  // Sincroniza la regla de retirada con el modo experto a través del hook controlador
  useEffect(() => {
    applyExpertMode(expertMode);
  }, [expertMode, applyExpertMode]);

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
          onChangeCell={(v) => setCellSize(v)}
          onChangeGap={(v) => setGapSize(v)}
          onReset={() => { setCellSize(48); setGapSize(6); }}
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
