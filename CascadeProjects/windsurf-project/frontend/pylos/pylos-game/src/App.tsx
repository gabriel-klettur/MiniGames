import { useMemo, useRef, useState, useEffect } from 'react';
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
import { posKey, getCell, isFree, setCell } from './game/board';
import FlyingPiece from './components/FlyingPiece';
import bolaA from './assets/bola_a.webp';
import bolaB from './assets/bola_b.webp';
import IAPanel from './components/IAPanel';
import { computeBestNextStateAsync } from './ia';

function App() {
  const [state, setState] = useState(() => initialState());
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  // Dev/tools toggle and Rules panel toggle
  const [showTools, setShowTools] = useState<boolean>(false);
  // IA panel toggle y parámetros (profundidad y límite de tiempo)
  const [showIA, setShowIA] = useState<boolean>(false);
  const [iaDepth, setIaDepth] = useState<number>(3);
  const [iaTimeMode, setIaTimeMode] = useState<'auto' | 'manual'>('auto');
  const [iaTimeSeconds, setIaTimeSeconds] = useState<number>(1.8);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [boardMode, , toggleBoardMode] = useBoardMode('pylos.boardMode', 'pyramid');
  const { logSnapshot } = useGameLogger(state);
  const [debugHitTest, setDebugHitTest] = useState<boolean>(false);
  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);
  // Refs for reserve icons in InfoPanel (left: L, right: D)
  const reserveLightRef = useRef<HTMLSpanElement | null>(null);
  const reserveDarkRef = useRef<HTMLSpanElement | null>(null);
  // Auto-completion control: timer and running flag
  const autoTimerRef = useRef<number | null>(null);
  const autoRunningRef = useRef<boolean>(false);

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
    // Avoid interactions while auto-completion is running
    if (autoRunningRef.current) return;
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
      // Compute origin rect from InfoPanel reserve icon of the current player
      const originEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
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
    if (flying) return;
    if (autoRunningRef.current) return;
    const sel = selectMoveSource(state, pos);
    if (!sel.error) updateAndCheck(sel.state);
  };

  const onDragEnd = () => {
    if (state.phase === 'selectMoveDest') {
      const res = cancelMoveSelection(state);
      if (!res.error) updateAndCheck(res.state);
    }
  };

  // Auto-complete pyramid when one player has 0 in reserve and the other has > 0.
  // Places pieces every 2 seconds, prioritizing lower levels first.
  useEffect(() => {
    // Stop any scheduling if game over or during recovery or while a flying anim is running
    if (gameOver || state.phase === 'recover' || !!flying) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // Determine filler player according to reserves
    const { L, D } = state.reserves;
    const filler: 'L' | 'D' | null = (L === 0 && D > 0) ? 'D' : (D === 0 && L > 0) ? 'L' : null;

    // If no auto-completion needed, ensure timer is cleared and exit
    if (!filler) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // If the top is already occupied, no need to continue
    const top = getCell(state.board, { level: 3, row: 0, col: 0 });
    if (top !== null) {
      autoRunningRef.current = false;
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    // If a timer is already scheduled, do not schedule another
    if (autoTimerRef.current !== null) return;

    autoRunningRef.current = true;
    autoTimerRef.current = window.setTimeout(() => {
      // Clear the timer ref right away to allow scheduling the next step
      autoTimerRef.current = null;

      // Recompute destinations on the current board; stable order by level, row, col
      const dests = validReserveDestinations(state.board)
        .slice()
        .sort((a, b) => (a.level - b.level) || (a.row - b.row) || (a.col - b.col));

      if (dests.length === 0) {
        autoRunningRef.current = false;
        return;
      }

      const dest = dests[0];
      // Prepare next state (will be applied after flying animation)
      const board = setCell(state.board, dest, filler);
      const newReserves = { ...state.reserves, [filler]: state.reserves[filler] - 1 } as typeof state.reserves;
      const nextState: typeof state = {
        ...state,
        board,
        reserves: newReserves,
        currentPlayer: filler,
        phase: 'play',
        selectedSource: undefined,
        recovery: undefined,
      };

      // Compute animation origin from InfoPanel reserve icons
      const originEl = filler === 'L' ? reserveLightRef.current : reserveDarkRef.current;
      const originRect = originEl?.getBoundingClientRect();
      const key = posKey(dest);
      const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
      const destRect = destBtn?.getBoundingClientRect();
      const imgSrc = filler === 'L' ? bolaA : bolaB;

      if (originRect && destRect) {
        const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
        const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
        setPendingState(nextState);
        setFlying({ from, to, imgSrc, destKey: key });
      } else {
        // Fallback: no measurement possible, apply immediately
        setAppearKeys(new Set([key]));
        updateAndCheck(nextState);
      }
    }, 500);

    // Cleanup: if deps change (e.g., leaving this mode), clear any pending timer
    return () => {
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [state, gameOver, flying]);

  const onNewGame = () => {
    setGameOver(undefined);
    const init = initialState();
    setState(init);
    logSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  const aiDisabled = !!gameOver || state.phase === 'recover' || !!flying || autoRunningRef.current;
  const [iaBusy, setIaBusy] = useState<boolean>(false);
  const iaAbortRef = useRef<AbortController | null>(null);
  const onAIMove = async () => {
    if (aiDisabled || iaBusy) return;
    setIaBusy(true);
    const ac = new AbortController();
    iaAbortRef.current = ac;
    try {
      // Resolver presupuesto de tiempo según selección del panel
      const timeMs = iaTimeMode === 'auto'
        ? (iaDepth > 5 ? 1800 : 800)
        : Math.max(0, Math.min(30, iaTimeSeconds)) * 1000;
      const next = await computeBestNextStateAsync(state, {
        depth: iaDepth,
        timeMs,
        signal: ac.signal,
      });
      updateAndCheck(next);
    } catch (err) {
      // ignorar AbortError o errores transitorios
    } finally {
      iaAbortRef.current = null;
      setIaBusy(false);
    }
  };

  // Cancelar búsqueda IA si el componente se desmonta
  useEffect(() => {
    return () => {
      if (iaAbortRef.current) iaAbortRef.current.abort();
    };
  }, []);

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
        showIA={showIA}
        onToggleIA={() => setShowIA((v) => !v)}
      />
      {showIA && (
        <IAPanel
          state={state}
          depth={iaDepth}
          onChangeDepth={setIaDepth}
          onAIMove={onAIMove}
          disabled={aiDisabled || iaBusy}
          timeMode={iaTimeMode}
          timeSeconds={iaTimeSeconds}
          onChangeTimeMode={setIaTimeMode}
          onChangeTimeSeconds={setIaTimeSeconds}
        />
      )}
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
        <InfoPanel
          state={state}
          onFinishRecovery={onFinishRecovery}
          currentPieceRef={currentPieceRef}
          reserveLightRef={reserveLightRef}
          reserveDarkRef={reserveDarkRef}
        />
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
          durationMs={1500}
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
