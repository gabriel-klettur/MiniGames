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
import MoveLog from './components/MoveLog';
import bolaA from './assets/bola_a.webp';
import bolaB from './assets/bola_b.webp';
import IAPanel from './components/IAPanel';
import { computeBestMoveAsync } from './ia';
import { applyMove } from './ia/moves';
import type { AIMove } from './ia/moves';

function App() {
  type MoveEntry = { player: 'L' | 'D'; source: 'PLAYER' | 'IA' | 'AUTO'; text: string };
  const [state, setState] = useState(() => initialState());
  // History stack for undo: stores previous states
  const [history, setHistory] = useState<GameState[]>([]);
  // Redo stack: states that can be re-applied after an undo
  const [redo, setRedo] = useState<GameState[]>([]);
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

  // Flying animation state (only for placing from reserve or recover)
  type Rect = { left: number; top: number; width: number; height: number };
  const [flying, setFlying] = useState<null | { from: Rect; to: Rect; imgSrc: string; destKey: string }>(null);
  const [pendingState, setPendingState] = useState<GameState | null>(null);
  const [pendingLog, setPendingLog] = useState<MoveEntry | null>(null);

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

  // Moves log for display under the board
  const [moves, setMoves] = useState<MoveEntry[]>([]);
  const [, setRedoMoves] = useState<MoveEntry[]>([]);

  const updateAndCheck = (nextState: typeof state, pushHistory: boolean = true, clearRedo: boolean = true, logEntry?: MoveEntry) => {
    // Save current state before applying the next one
    if (pushHistory) {
      setHistory((h) => [...h, state]);
    }
    if (clearRedo) {
      setRedo([]);
      setRedoMoves([]);
    }
    if (logEntry) {
      setMoves((m) => [...m, logEntry]);
    }
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

  // Undo last move: restore previous state from history
  const onUndo = () => {
    if (flying || autoRunningRef.current) return;
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      // Apply without recording a new history entry
      setRedo((r) => [...r, state]);
      // Move last log entry to redoMoves as well
      setMoves((m) => {
        if (m.length === 0) return m;
        const last = m[m.length - 1];
        setRedoMoves((rm) => [...rm, last]);
        return m.slice(0, -1);
      });
      updateAndCheck(prev, false, false);
      return h.slice(0, -1);
    });
  };

  // Redo last undone move
  const onRedo = () => {
    if (flying || autoRunningRef.current) return;
    setRedo((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      // Push current into history and apply next without clearing redo (we slice it manually)
      setHistory((h) => [...h, state]);
      // Bring back last redo log entry to main moves
      setRedoMoves((rm) => {
        if (rm.length === 0) return rm;
        const last = rm[rm.length - 1];
        setMoves((m) => [...m, last]);
        return rm.slice(0, -1);
      });
      updateAndCheck(next, false, false);
      return r.slice(0, -1);
    });
  };

  const onCellClick = (pos: Position) => {
    if (gameOver) return;
    // Avoid interactions while auto-completion is running
    if (autoRunningRef.current) return;
    // Avoid interactions while a flying animation is running
    if (flying) return;
    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) {
        // Animate removal: fly from the board cell to the reserve icon of the current player
        const key = posKey(pos);
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const srcRect = srcBtn?.getBoundingClientRect();
        const destEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const destRect = destEl?.getBoundingClientRect();
        const imgSrc = state.currentPlayer === 'L' ? bolaA : bolaB;
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `recuperar ${key}` };
        if (srcRect && destRect) {
          const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          setPendingState(res.state);
          setPendingLog(log);
          setFlying({ from, to, imgSrc, destKey: key });
        } else {
          // Fallback if we cannot measure DOM positions
          updateAndCheck(res.state, true, true, log);
        }
      }
      return;
    }

    if (state.phase === 'selectMoveDest') {
      // allow switching source by clicking the same source (to cancel)
      const srcKey = state.selectedSource ? posKey(state.selectedSource) : '';
      if (state.selectedSource && posKey(pos) === srcKey) {
        const res = cancelMoveSelection(state);
        if (!res.error) updateAndCheck(res.state, false, false);
        return;
      }

      // allow switching to another own free piece as the new source
      const owner = getCell(state.board, pos);
      if (owner === state.currentPlayer && isFree(state.board, pos)) {
        const sel = selectMoveSource(state, pos);
        if (!sel.error) updateAndCheck(sel.state, false, false);
        return;
      }

      // otherwise, try to move to a highlighted destination
      const attempt = movePiece(state, pos);
      if (!attempt.error) {
        setAppearKeys(new Set([posKey(pos)]));
        const srcKey = state.selectedSource ? posKey(state.selectedSource) : '?';
        const dstKey = posKey(pos);
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `subir ${srcKey} -> ${dstKey}` };
        updateAndCheck(attempt.state, true, true, log);
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
      const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `colocar ${key}` };

      if (originRect && destRect) {
        const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
        const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
        const imgSrc = state.currentPlayer === 'L' ? bolaA : bolaB;
        // Start flying animation and apply state after it finishes
        setFlying({ from, to, imgSrc, destKey: key });
        setPendingState(placed.state);
        setPendingLog(log);
      } else {
        // Fallback: if we fail to measure, update immediately
        setAppearKeys(new Set([key]));
        updateAndCheck(placed.state, true, true, log);
      }
      return;
    }
    // Else, try selecting a movable source
    const sel = selectMoveSource(state, pos);
    if (!sel.error) {
      updateAndCheck(sel.state, false, false);
      return;
    }
  };

  // Drag & drop handlers
  const onDragStart = (pos: Position) => {
    if (gameOver) return;
    if (flying) return;
    if (autoRunningRef.current) return;
    const sel = selectMoveSource(state, pos);
    if (!sel.error) updateAndCheck(sel.state, false);
  };

  const onDragEnd = () => {
    if (state.phase === 'selectMoveDest') {
      const res = cancelMoveSelection(state);
      if (!res.error) updateAndCheck(res.state, false, false);
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

      const autoLog: MoveEntry = { player: filler, source: 'AUTO', text: `colocar ${key}` };
      if (originRect && destRect) {
        const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
        const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
        setPendingState(nextState);
        setPendingLog(autoLog);
        setFlying({ from, to, imgSrc, destKey: key });
      } else {
        // Fallback: no measurement possible, apply immediately
        setAppearKeys(new Set([key]));
        updateAndCheck(nextState, true, true, autoLog);
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
    setHistory([]);
    setRedo([]);
    logSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  const aiDisabled = !!gameOver || state.phase === 'recover' || !!flying || autoRunningRef.current;
  const [iaBusy, setIaBusy] = useState<boolean>(false);
  const [iaProgress, setIaProgress] = useState<{ depth: number; score: number } | null>(null);
  // Últimos resultados para visualización
  const [iaEval, setIaEval] = useState<number | null>(null);
  const [iaDepthReached, setIaDepthReached] = useState<number | null>(null);
  const [iaPV, setIaPV] = useState<AIMove[]>([]);
  const [iaRootMoves, setIaRootMoves] = useState<Array<{ move: AIMove; score: number }>>([]);
  const [iaNodes, setIaNodes] = useState<number>(0);
  const [iaElapsedMs, setIaElapsedMs] = useState<number>(0);
  const [iaNps, setIaNps] = useState<number>(0);
  const [iaRootPlayer, setIaRootPlayer] = useState<'L' | 'D' | null>(null);
  const iaAbortRef = useRef<AbortController | null>(null);
  const onAIMove = async () => {
    if (aiDisabled || iaBusy) return;
    setIaBusy(true);
    setIaProgress(null);
    setIaEval(null);
    setIaDepthReached(null);
    setIaPV([]);
    setIaRootMoves([]);
    setIaNodes(0);
    setIaElapsedMs(0);
    setIaNps(0);
    // Capture the AI's player at the moment thinking starts to avoid races
    const aiPlayer: 'L' | 'D' = state.currentPlayer;
    setIaRootPlayer(aiPlayer);
    const ac = new AbortController();
    iaAbortRef.current = ac;
    try {
      // Resolver presupuesto de tiempo según selección del panel
      const timeMs = iaTimeMode === 'auto'
        ? (iaDepth > 5 ? 1800 : 800)
        : Math.max(0, Math.min(30, iaTimeSeconds)) * 1000;
      const res = await computeBestMoveAsync(state, {
        depth: iaDepth,
        timeMs,
        signal: ac.signal,
        onProgress: (info) => setIaProgress(info),
      });
      // Guardar métricas y PV para visualización SIEMPRE (aunque no haya jugada)
      setIaEval(res.score);
      setIaDepthReached(res.depthReached);
      setIaPV(res.pv);
      setIaRootMoves(res.rootMoves);
      setIaNodes(res.nodes);
      setIaElapsedMs(res.elapsedMs);
      setIaNps(res.nps);
      if (res.move) {
        // Preparar animaciones acorde al tipo de jugada IA
        if (res.move.kind === 'place') {
          const dest = res.move.dest;
          const key = posKey(dest);
          // Calcular origen: icono de reservas del jugador IA capturado al inicio
          const originEl = aiPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
          const originRect = originEl?.getBoundingClientRect();
          // Calcular destino: botón de celda
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaA : bolaB;
          const nextState = applyMove(state, res.move);
          if (originRect && destRect) {
            const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `colocar ${key}` });
            setFlying({ from, to, imgSrc, destKey: key });
          } else {
            // Fallback si no podemos medir
            setAppearKeys(new Set([key]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `colocar ${key}` });
          }
        } else if (res.move.kind === 'lift') {
          // Animar elevación: volar desde src hasta dest con la pieza del jugador actual
          const srcKey = posKey(res.move.src);
          const destKey = posKey(res.move.dest);
          const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${srcKey}"]`);
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${destKey}"]`);
          const srcRect = srcBtn?.getBoundingClientRect();
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaA : bolaB;
          const nextState = applyMove(state, res.move);
          if (srcRect && destRect) {
            const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
            setFlying({ from, to, imgSrc, destKey });
          } else {
            // Fallback si no podemos medir
            setAppearKeys(new Set([destKey]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
          }
        }
      }
    } catch (err) {
      // ignorar AbortError o errores transitorios
    } finally {
      iaAbortRef.current = null;
      setIaBusy(false);
      setIaProgress(null);
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
    if (!res.error) updateAndCheck(res.state, true, true, { player: state.currentPlayer, source: 'PLAYER', text: 'fin recuperación' });
  };

  return (
    <div className="app">
      <HeaderPanel
        onNewGame={onNewGame}
        onUndo={onUndo}
        canUndo={history.length > 0 && !flying && !autoRunningRef.current && !iaBusy}
        onRedo={onRedo}
        canRedo={redo.length > 0 && !flying && !autoRunningRef.current && !iaBusy}
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
          busy={iaBusy}
          progress={iaProgress}
          evalScore={iaEval}
          depthReached={iaDepthReached}
          pv={iaPV}
          rootMoves={iaRootMoves}
          nodes={iaNodes}
          elapsedMs={iaElapsedMs}
          nps={iaNps}
          rootPlayer={iaRootPlayer ?? undefined}
          moving={!!flying}
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
        <MoveLog moves={moves} />
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
              updateAndCheck(pendingState, true, true, pendingLog ?? undefined);
            }
            setPendingState(null);
            setPendingLog(null);
            setFlying(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
