import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Board from './components/Board';
import Sidebar from './components/Sidebar';
import InfoPanel from './components/InfoPanel';
import type { GameState, Position } from './game/types';
import { initialState, placeFromReserve, selectMoveSource, cancelMoveSelection, movePiece, recoverPiece, finishRecovery, validMoveDestinations, validReserveDestinations, isGameOver, recoverablePositions } from './game/rules';
import { posKey } from './game/board';

function App() {
  const [state, setState] = useState(() => initialState());
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  const LS_MODE_KEY = 'pylos.boardMode';
  const [boardMode, setBoardMode] = useState<'pyramid' | 'stacked'>(() => {
    try {
      const saved = localStorage.getItem(LS_MODE_KEY);
      return saved === 'stacked' || saved === 'pyramid' ? saved : 'pyramid';
    } catch {
      return 'pyramid';
    }
  });

  // Helper: map cell -> visual symbol
  const cellSymbol = (cell: 'L' | 'D' | null): string => (cell === 'L' ? '○' : cell === 'D' ? '●' : '·');

  // Pretty-print the full game snapshot using console.table per level
  const printBoardSnapshot = (snapshot: GameState, label?: string) => {
    const { board, currentPlayer, phase, reserves } = snapshot;
    const header = label ?? `Turno de ${currentPlayer} — Fase: ${phase}`;
    console.groupCollapsed(header);
    console.info(`Jugador: ${currentPlayer} | Fase: ${phase} | Reservas: L=${reserves.L} D=${reserves.D}`);
    for (let l = 0; l < board.length; l++) {
      const grid = board[l];
      const size = grid.length;
      console.log(`Nivel ${l} (${size}x${size})`);
      const table = grid.map((row) => row.map(cellSymbol));
      // Render as a table with indexed columns
      console.table(table);
    }
    console.groupEnd();
  };

  // Print board once on initial mount (guard against StrictMode double-run in dev)
  const didLogInitialRef = useRef(false);
  useEffect(() => {
    if (didLogInitialRef.current) return;
    didLogInitialRef.current = true;
    printBoardSnapshot(state, 'Estado inicial — tablero');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist board mode on change
  useEffect(() => {
    try { localStorage.setItem(LS_MODE_KEY, boardMode); } catch { /* ignore */ }
  }, [boardMode]);

  const highlights: Set<string> = useMemo(() => {
    if (gameOver) return new Set();
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    if (state.phase === 'selectMoveDest' && state.selectedSource) {
      return new Set(validMoveDestinations(state.board, state.selectedSource).map(posKey));
    }
    // phase 'play': highlight valid reserve placements
    return new Set(validReserveDestinations(state.board).map(posKey));
  }, [state, gameOver]);

  // Animation keys
  const [appearKeys, setAppearKeys] = useState<Set<string>>(new Set());
  const flashKeys: Set<string> = useMemo(() => {
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    return new Set();
  }, [state.phase, state.recovery, state.board]);

  const updateAndCheck = (nextState: typeof state) => {
    setState(nextState);
    // Log board snapshot after each state update
    printBoardSnapshot(nextState);
    const over = isGameOver(nextState);
    if (over.over) {
      const text = over.winner ? `Ganador: ${over.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)'} — ${over.reason ?? ''}` : 'Partida terminada';
      setGameOver(text);
    } else {
      setGameOver(undefined);
    }
  };

  const onCellClick = (pos: Position) => {
    if (gameOver) return;
    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) updateAndCheck(res.state);
      return;
    }

    if (state.phase === 'selectMoveDest') {
      // allow switching source by clicking another free own piece
      const srcKey = state.selectedSource ? posKey(state.selectedSource) : '';
      if (state.selectedSource && posKey(pos) === srcKey) {
        const res = cancelMoveSelection(state);
        if (!res.error) updateAndCheck(res.state);
        return;
      }

      const attempt = movePiece(state, pos);
      if (!attempt.error) {
        setAppearKeys(new Set([posKey(pos)]));
        updateAndCheck(attempt.state);
      }
      return;
    }

    // phase 'play'
    // Try place from reserve if clicked empty supported cell
    const placed = placeFromReserve(state, pos);
    if (!placed.error) {
      setAppearKeys(new Set([posKey(pos)]));
      updateAndCheck(placed.state);
      return;
    }
    // Else, try selecting a movable source
    const sel = selectMoveSource(state, pos);
    if (!sel.error) {
      updateAndCheck(sel.state);
      return;
    }
  };

  // Drag & drop handlers
  const onDragStart = (pos: Position) => {
    if (gameOver) return;
    const sel = selectMoveSource(state, pos);
    if (!sel.error) updateAndCheck(sel.state);
  };

  const onDragEnd = () => {
    if (state.phase === 'selectMoveDest') {
      const res = cancelMoveSelection(state);
      if (!res.error) updateAndCheck(res.state);
    }
  };

  const onNewGame = () => {
    setGameOver(undefined);
    const init = initialState();
    setState(init);
    printBoardSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  const onFinishRecovery = () => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state);
  };

  return (
    <div className="app">
      <Sidebar
        state={state}
        onNewGame={onNewGame}
        gameOverText={gameOver}
        boardMode={boardMode}
        onToggleBoardMode={() => setBoardMode((m) => (m === 'pyramid' ? 'stacked' : 'pyramid'))}
      />
      <div className="content">
        <InfoPanel state={state} onFinishRecovery={onFinishRecovery} gameOverText={gameOver} />
        <Board
          state={state}
          onCellClick={onCellClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          highlights={highlights}
          selected={state.selectedSource}
          posKey={posKey}
          appearKeys={appearKeys}
          flashKeys={flashKeys}
          viewMode={boardMode}
        />
      </div>
    </div>
  );
}

export default App;
