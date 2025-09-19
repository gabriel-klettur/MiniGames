import React, { useMemo, useState } from 'react';
import PylosBoard from './PylosBoard';
import { GameState } from '../game/gameState';
import type { Cell } from '../game/types';

const PylosGame: React.FC = () => {
  const [game, setGame] = useState(() => new GameState());
  const [selectedSrc, setSelectedSrc] = useState<Cell | null>(null);
  const [expertMode, setExpertMode] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showHoles, setShowHoles] = useState<boolean>(false);
  const [showIndices, setShowIndices] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  // Board scaling (CSS variables consumed by PylosBoard)
  const [cellSize, setCellSize] = useState<number>(48);
  const [gapSize, setGapSize] = useState<number>(6);

  // Keep GameState's rule flag in sync with UI toggle
  useMemo(() => {
    game.allowSquareRemoval = expertMode;
    // Trigger re-render in case subphase could change after a move
    setGame(game.clone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertMode]);

  const handleCellClick = (cell: Cell) => {
    if (game.phase === 'ENDED') return;

    if (game.subphase === 'REMOVAL') {
      const changed = game.removeOwnFree(cell);
      if (changed) {
        setGame(game.clone());
      }
      return;
    }

    // ACTION subphase
    const owner = game.board.get(cell);
    const isOwn = owner === game.currentPlayer;
    const isFree = isOwn && game.board.isFree(cell);

    // 1) Click own free marble -> select/deselect as src
    if (isFree) {
      setSelectedSrc((prev) => (prev && prev.layer === cell.layer && prev.x === cell.x && prev.y === cell.y ? null : cell));
      return;
    }

    // 2) If a src is selected and clicking a destination -> attempt climb
    if (selectedSrc) {
      const moved = game.attemptClimb(selectedSrc, cell);
      if (moved) {
        setSelectedSrc(null);
        setGame(game.clone());
        return;
      }
    }

    // 3) Otherwise, try placement
    const placed = game.attemptPlace(cell);
    if (placed) {
      setSelectedSrc(null);
      setGame(game.clone());
    }
  };

  const finishRemoval = () => {
    if (game.subphase !== 'REMOVAL') return;
    game.finishRemoval();
    setGame(game.clone());
  };

  const resetGame = () => {
    const g = new GameState();
    g.allowSquareRemoval = expertMode;
    setSelectedSrc(null);
    setGame(g);
  };

  const toggleMode = () => setExpertMode((v) => !v);
  const toggleInfo = () => setShowInfo((v) => !v);
  const toggleHoles = () => setShowHoles((v) => !v);
  const toggleIndices = () => setShowIndices((v) => !v);
  const toggleConfig = () => setShowConfig((v) => !v);

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <h1>Pylos (Web, React + TS)</h1>
      <div className="controls">
        <button onClick={resetGame}>Reset</button>
        <button onClick={toggleMode}>
          Modo: {expertMode ? 'Experto (con retirada por cuadrados/líneas)' : 'Niño (sin retirada)'}
        </button>
        <button onClick={toggleInfo}>{showInfo ? 'Ocultar info' : 'Mostrar info'}</button>
        <button onClick={toggleHoles}>{showHoles ? 'Ocultar huecos' : 'Mostrar huecos'}</button>
        <button onClick={toggleIndices}>{showIndices ? 'Ocultar índices' : 'Mostrar índices'}</button>
        <button onClick={toggleConfig}>{showConfig ? 'Cerrar configuración' : 'Configuración'}</button>
      </div>
      {showConfig && (
        <div className="config-panel">
          <div className="row">
            <label>
              Tamaño celda: {cellSize}px
              <input
                type="range"
                min={36}
                max={96}
                step={2}
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="row">
            <label>
              Separación: {gapSize}px
              <input
                type="range"
                min={4}
                max={16}
                step={1}
                value={gapSize}
                onChange={(e) => setGapSize(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="row">
            <button onClick={() => { setCellSize(48); setGapSize(6); }}>Restablecer</button>
          </div>
        </div>
      )}
      <PylosBoard
        board={game.board}
        currentPlayer={game.currentPlayer}
        subphase={game.subphase}
        selectedSrc={selectedSrc}
        onCellClick={handleCellClick}
        onFinishRemoval={finishRemoval}
        canFinishRemoval={game.canFinishRemoval()}
        showHoles={showHoles}
        showIndices={showIndices}
        cellSize={cellSize}
        gapSize={gapSize}
        configMode={showConfig}
        onResize={(nextCell, nextGap) => { setCellSize(nextCell); setGapSize(nextGap); }}
      />
      <div className="status">{game.statusText()}</div>
      {showInfo && (
        <div style={{ color: '#ddd', display: 'grid', gap: 6, textAlign: 'center' }}>
          <div>Turno: Jugador {game.currentPlayer} — Subfase: {game.subphase}</div>
          <div>Reservas: P1 {game.reserveRemaining(1)} | P2 {game.reserveRemaining(2)}</div>
          <div>Retiradas: permitidas {game.removalsAllowed}, tomadas {game.removalsTaken}</div>
        </div>
      )}
    </div>
  );
};

export default PylosGame;
