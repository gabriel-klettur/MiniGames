import { useMemo, useRef, useState } from 'react';
import './App.css';
import Board from './components/Board';
import InfoPanel from './components/InfoPanel';
import HeaderPanel from './components/HeaderPanel';
import FasePanel from './components/FasePanel';
import DevToolsPanel from './components/DevToolsPanel';
import RulesPanel from './components/RulesPanel';
import { useBoardMode } from './hooks/useBoardMode';
import { useGameLogger } from './hooks/useGameLogger';
import type { GameState, Position } from './game/types';
import { initialState, placeFromReserve, selectMoveSource, cancelMoveSelection, movePiece, recoverPiece, finishRecovery, validMoveDestinations, validReserveDestinations, isGameOver, recoverablePositions } from './game/rules';
import { posKey, getCell, isFree } from './game/board';
import FlyingPiece from './components/FlyingPiece';
import bolaA from './assets/bola_a.webp';
import bolaB from './assets/bola_b.webp';

function App() {
  const [state, setState] = useState(() => initialState());
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  // Dev/tools toggle and Rules panel toggle
  const [showTools, setShowTools] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [boardMode, , toggleBoardMode] = useBoardMode('pylos.boardMode', 'pyramid');
  const { logSnapshot } = useGameLogger(state);
  const [debugHitTest, setDebugHitTest] = useState<boolean>(false);
  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);

  // Flying animation state (only for placing from reserve)
  type Rect = { left: number; top: number; width: number; height: number };
  const [flying, setFlying] = useState<null | { from: Rect; to: Rect; imgSrc: string; destKey: string }>(null);
  const [pendingState, setPendingState] = useState<GameState | null>(null);

  // Logging centralizado por useGameLogger (incluye log inicial)

  // Board mode persistence now handled by useBoardMode hook

  const highlights: Set<string> = useMemo(() => {
    if (gameOver) return new Set();
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    if (state.phase === 'selectMoveDest' && state.selectedSource) {
      return new Set(validMoveDestinations(state.board, state.selectedSource).map(posKey));
    }
    // phase 'play': highlight valid reserve placements on ALL supported levels
    if (state.phase === 'play') {
      return new Set(validReserveDestinations(state.board).map(posKey));
    }
    return new Set();
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
    logSnapshot(nextState);
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
    // Avoid interactions while a flying animation is running
    if (flying) return;
    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) updateAndCheck(res.state);
      return;
    }

    if (state.phase === 'selectMoveDest') {
      // allow switching source by clicking the same source (to cancel)
      const srcKey = state.selectedSource ? posKey(state.selectedSource) : '';
      if (state.selectedSource && posKey(pos) === srcKey) {
        const res = cancelMoveSelection(state);
        if (!res.error) updateAndCheck(res.state);
        return;
      }

      // allow switching to another own free piece as the new source
      const owner = getCell(state.board, pos);
      if (owner === state.currentPlayer && isFree(state.board, pos)) {
        const sel = selectMoveSource(state, pos);
        if (!sel.error) updateAndCheck(sel.state);
        return;
      }

      // otherwise, try to move to a highlighted destination
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
      const key = posKey(pos);
      // Compute origin rect from InfoPanel current piece
      const originEl = currentPieceRef.current;
      const originRect = originEl?.getBoundingClientRect();
      // Compute destination rect from the target cell button
      const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
      const destRect = destBtn?.getBoundingClientRect();

      if (originRect && destRect) {
        const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
        const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
        const imgSrc = state.currentPlayer === 'L' ? bolaA : bolaB;
        // Start flying animation and apply state after it finishes
        setFlying({ from, to, imgSrc, destKey: key });
        setPendingState(placed.state);
      } else {
        // Fallback: if we fail to measure, update immediately
        setAppearKeys(new Set([key]));
        updateAndCheck(placed.state);
      }
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
    logSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  const onFinishRecovery = () => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state);
  };

  return (
    <div className="app">
      <HeaderPanel
        onNewGame={onNewGame}
        showTools={showTools}
        onToggleDev={() => setShowTools((v) => !v)}
      />
      {showTools && (
        <DevToolsPanel
          onToggleBoardMode={toggleBoardMode}
          onToggleRules={() => setShowRules((v) => !v)}
          boardMode={boardMode}
          debugOn={debugHitTest}
          onToggleDebug={() => setDebugHitTest((v) => !v)}
        />
      )}
      {showTools && (
        <FasePanel state={state} gameOverText={gameOver} />
      )}
      {showRules && (
        <RulesPanel />
      )}
      <div className="content">
        <InfoPanel state={state} onFinishRecovery={onFinishRecovery} currentPieceRef={currentPieceRef} />
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
          debugHitTest={debugHitTest}
        />
        {gameOver && (
          <div className="gameover-banner" role="status" aria-live="polite">
            <div className="gameover-banner__text">{gameOver}</div>
            <div className="gameover-banner__actions">
              <button className="primary" onClick={onNewGame} aria-label="Empezar otra partida">OK</button>
            </div>
          </div>
        )}
      </div>
      {flying && (
        <FlyingPiece
          from={flying.from}
          to={flying.to}
          imgSrc={flying.imgSrc}
          durationMs={420}
          onDone={() => {
            // Apply the game state update after the piece has flown
            if (pendingState) {
              // trigger a small appear effect on the destination cell
              setAppearKeys(new Set([flying.destKey]));
              updateAndCheck(pendingState);
            }
            setPendingState(null);
            setFlying(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
