import { useMemo, useRef, useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import InfoPanel from './components/InfoPanel';
import HeaderPanel from './components/HeaderPanel';
import FasePanel from './components/FasePanel';
import DevToolsPanel from './components/DevToolsPanel';
import InfoIA from './components/InfoIA';
import RulesPanel from './components/RulesPanel';
import { useGameLogger } from './hooks/useGameLogger';
import type { GameState, Position } from './game/types';
import { initialState, placeFromReserve, selectMoveSource, cancelMoveSelection, movePiece, recoverPiece, finishRecovery, validMoveDestinations, validReserveDestinations, isGameOver, recoverablePositions } from './game/rules';
import { posKey, getCell, isFree, setCell, positions, isSupported } from './game/board';
import FlyingPiece from './components/FlyingPiece';
import MoveLog from './components/MoveLog';
import bolaA from './assets/bola_a.webp';
import bolaB from './assets/bola_b.webp';
import IAPanel from './components/IAPanel';
import IAUserPanel from './components/IAUserPanel';
import FootPanel from './components/FootPanel';
import UXPanel from './components/UXPanel';
import GameOverModal from './components/GameOverModal';
import { usePersistence } from './hooks/usePersistence';
import type { MoveEntry } from './hooks/usePersistence';
import { useAnimations } from './hooks/useAnimations';
import { useHistoryLogic } from './hooks/useHistory';
import { useAI } from './hooks/useAI';

function App() {
  const {
    state,
    setState,
    moves,
    setMoves,
    vsAI,
    setVsAI,
    iaDepth,
    setIaDepth,
    iaTimeMode,
    setIaTimeMode,
    iaTimeSeconds,
    setIaTimeSeconds,
    showIAUser,
    setShowIAUser,
  } = usePersistence();
  // History stacks managed by useHistoryLogic (initialized later)
  let history: GameState[] = [];
  let setHistory: React.Dispatch<React.SetStateAction<GameState[]>>;
  let redo: GameState[] = [];
  let setRedo: React.Dispatch<React.SetStateAction<GameState[]>>;
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  // Dev/tools toggle and Rules panel toggle
  const [showTools, setShowTools] = useState<boolean>(false);
  // IA panel toggles y parámetros (User vs DevTools)
  const [showIATools, setShowIATools] = useState<boolean>(false);   // IAPanel dentro de DevToolsPanel
  // Historial de movimientos (inicialmente oculto)
  const [showHistory, setShowHistory] = useState<boolean>(false);
  // FasePanel (inicialmente oculto)
  const [showFases, setShowFases] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  // InfoIA panel (simulaciones y métricas) dentro de DevTools
  const [showInfoIA, setShowInfoIA] = useState<boolean>(false);
  // IA advanced configuration (quiescence/book/precomputed flags)
  const [iaConfig, setIaConfig] = useState<{ quiescence: boolean; qDepthMax: number; qNodeCap: number; futilityMargin: number; bookEnabled: boolean; bookUrl: string; precomputedSupports?: boolean; precomputedCenter?: boolean; pvsEnabled?: boolean; aspirationEnabled?: boolean; ttEnabled?: boolean; avoidRepeats?: boolean; repeatMax?: number; avoidPenalty?: number }>(() => {
    try {
      const raw = localStorage.getItem('pylos.ia.advanced.v1');
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          return {
            quiescence: typeof p.quiescence === 'boolean' ? p.quiescence : true,
            qDepthMax: Number.isFinite(p.qDepthMax) ? Math.max(0, Math.min(4, Math.floor(p.qDepthMax))) : 2,
            qNodeCap: Number.isFinite(p.qNodeCap) ? Math.max(1, Math.min(128, Math.floor(p.qNodeCap))) : 24,
            futilityMargin: Number.isFinite(p.futilityMargin) ? Math.max(0, Math.min(1000, Math.floor(p.futilityMargin))) : 100,
            bookEnabled: typeof p.bookEnabled === 'boolean' ? p.bookEnabled : true,
            bookUrl: typeof p.bookUrl === 'string' && p.bookUrl.trim().length > 0 ? p.bookUrl : '/aperturas_book.json',
            precomputedSupports: typeof p.precomputedSupports === 'boolean' ? p.precomputedSupports : true,
            precomputedCenter: typeof p.precomputedCenter === 'boolean' ? p.precomputedCenter : true,
            pvsEnabled: typeof p.pvsEnabled === 'boolean' ? p.pvsEnabled : true,
            aspirationEnabled: typeof p.aspirationEnabled === 'boolean' ? p.aspirationEnabled : true,
            ttEnabled: typeof p.ttEnabled === 'boolean' ? p.ttEnabled : true,
            avoidRepeats: typeof p.avoidRepeats === 'boolean' ? p.avoidRepeats : true,
            repeatMax: Number.isFinite(p.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : 3,
            avoidPenalty: Number.isFinite(p.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : 50,
          };
        }
      }
    } catch {}
    return { quiescence: true, qDepthMax: 2, qNodeCap: 24, futilityMargin: 100, bookEnabled: true, bookUrl: '/aperturas_book.json', precomputedSupports: true, precomputedCenter: true, pvsEnabled: true, aspirationEnabled: true, ttEnabled: true, avoidRepeats: true, repeatMax: 3, avoidPenalty: 50 };
  });
  useEffect(() => {
    try { localStorage.setItem('pylos.ia.advanced.v1', JSON.stringify(iaConfig)); } catch {}
  }, [iaConfig]);
  const { logSnapshot } = useGameLogger(state);
  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);
  // Refs for reserve icons in InfoPanel (left: L, right: D)
  const reserveLightRef = useRef<HTMLSpanElement | null>(null);
  const reserveDarkRef = useRef<HTMLSpanElement | null>(null);
  // Auto-completion control: timer and running flag
  const autoTimerRef = useRef<number | null>(null);
  const autoRunningRef = useRef<boolean>(false);
  // IA autoplay timer is managed inside useAI

  // Animations and UI/UX via hook
  const {
    flying,
    setFlying,
    pendingState,
    setPendingState,
    pendingLog,
    setPendingLog,
    pendingApplyRef,
    lastAppearKeyRef,
    appearKeys,
    setAppearKeys,
    getFlashKeys,
    pieceScale,
    setPieceScale,
    animAppearMs,
    setAnimAppearMs,
    animFlashMs,
    setAnimFlashMs,
    animFlyMs,
    setAnimFlyMs,
    noShade,
    setNoShade,
    shadeOnlyAvailable,
    setShadeOnlyAvailable,
    shadeOnlyHoles,
    setShadeOnlyHoles,
    holeBorders,
    setHoleBorders,
  } = useAnimations();
  // Preserve board while InfoIA mirrors a fast simulation
  const mirrorPrevStateRef = useRef<GameState | null>(null);
  // redoingRef will come from the history hook

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

  // Flash keys derived via hook helper
  const flashKeys: Set<string> = getFlashKeys(state);
  const [, setRedoMoves] = useState<MoveEntry[]>([]);
  // Derive last IA move side for InfoPanel indicator
  const lastIaMove: 'L' | 'D' | null = useMemo(() => {
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i].source === 'IA') return moves[i].player;
    }
    return null;
  }, [moves]);

  // === UI/UX CONFIG STATE ===
  // Mostrar panel UI/UX en DevTools
  const [showUX, setShowUX] = useState<boolean>(false);
  // Pausa entre pasos de autocolocación final (ms)
  const [autoFillDelayMs, setAutoFillDelayMs] = useState<number>(250);

  // Calcular niveles disponibles según el tablero actual
  const availableLevels = useMemo(() => {
    const avail: Record<0 | 1 | 2 | 3, boolean> = { 0: true, 1: false, 2: false, 3: false } as any;
    for (let l = 1 as 0 | 1 | 2 | 3; l <= 3; l = (l + 1) as 0 | 1 | 2 | 3) {
      const someSupported = positions(l).some((p) => isSupported(state.board, p));
      (avail as any)[l] = someSupported;
    }
    return avail;
  }, [state.board]);

  // noShade efectivo: si el modo auto está activo, ocultamos sombreado en niveles NO disponibles
  const noShadeEffective = shadeOnlyAvailable
    ? ({ 0: !availableLevels[0], 1: !availableLevels[1], 2: !availableLevels[2], 3: !availableLevels[3] } as { 0: boolean; 1: boolean; 2: boolean; 3: boolean })
    : noShade;

  // CSS variables are synchronized inside useAnimations hook

  // Persistence handled by usePersistence

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

  // History logic hook (includes onUndo with animation)
  const historyHook = useHistoryLogic({
    state,
    moves,
    setMoves,
    setRedoMoves,
    flying,
    autoRunningRef,
    reserveLightRef,
    reserveDarkRef,
    updateAndCheck,
    setFlying,
  });
  ({ history, setHistory, redo, setRedo } = historyHook);
  const { onUndo, redoingRef } = historyHook;


  const onCellClick = (pos: Position) => {
    if (gameOver) return;
    // Avoid interactions while auto-completion is running
    if (autoRunningRef.current) return;
    // Avoid interactions while a flying animation is running
    if (flying) return;
    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) {
        const key = posKey(pos);
        // Medimos ANTES de aplicar el estado para obtener el rect de origen preciso
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const srcRect = srcBtn?.getBoundingClientRect();
        const destEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const destRect = destEl?.getBoundingClientRect();
        const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `recuperar ${key}` };
        if (srcRect && destRect) {
          const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          // 1) Aplicar el nuevo estado primero: quita la bola del tablero y actualiza reservas/historial
          updateAndCheck(res.state, true, true, log);
          // 2) Lanzar la animación de vuelo del clon desde el tablero al InfoPanel
          //    (sin estado pendiente: evitamos doble render o re-aplicaciones en onDone)
          setFlying({ from, to, imgSrc, destKey: '' });
        } else {
          // Fallback si no podemos medir posiciones del DOM
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
        const srcKey2 = state.selectedSource ? posKey(state.selectedSource) : '?';
        const dstKey = posKey(pos);
        const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `subir ${srcKey2} -> ${dstKey}` };

        // Try to animate lift: measure source and destination cell rects
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${srcKey2}"]`);
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${dstKey}"]`);
        const sRect = srcBtn?.getBoundingClientRect();
        const dRect = destBtn?.getBoundingClientRect();
        const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
        if (sRect && dRect) {
          const from = { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height };
          const to = { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height };
          setPendingState(attempt.state);
          setPendingLog(log);
          pendingApplyRef.current = { pushHistory: true, clearRedo: true };
          setFlying({ from, to, imgSrc, destKey: dstKey });
        } else {
          // Fallback: if we cannot measure DOM positions, apply immediately
          setAppearKeys(new Set([dstKey]));
          updateAndCheck(attempt.state, true, true, log);
        }
      }
      return;
    }

    // phase 'play'
    // Try place from reserve if clicked empty supported cell
    const placed = placeFromReserve(state, pos);
    if (!placed.error) {
      const key = posKey(pos);
      const log: MoveEntry = { player: state.currentPlayer, source: 'PLAYER', text: `colocar ${key}` };

      // Try to measure origin/destination; retry up to 3 frames if needed
      const tryAnimatePlace = (attempt: number) => {
        // Prefer reserve icon; fallback to current piece icon in center
        const primaryOriginEl = state.currentPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const fallbackOriginEl = currentPieceRef.current;
        const originEl = primaryOriginEl ?? fallbackOriginEl ?? null;
        const originRect = originEl?.getBoundingClientRect();
        // Compute destination rect from the target cell button
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const destRect = destBtn?.getBoundingClientRect();

        if (originRect && destRect) {
          console.debug('[FLY place] attempt=%d originRect=%o destRect=%o', attempt, originRect, destRect);
          // Guard against 0-sized rects (can happen during layout)
          const minSize = 12; // px; small but visible, replaced quickly by scale
          const from = {
            left: originRect.left,
            top: originRect.top,
            width: Math.max(minSize, originRect.width),
            height: Math.max(minSize, originRect.height),
          };
          const to = {
            left: destRect.left,
            top: destRect.top,
            width: Math.max(minSize, destRect.width),
            height: Math.max(minSize, destRect.height),
          };
          const imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA;
          // Start flying animation and apply state after it finishes
          setFlying({ from, to, imgSrc, destKey: key });
          setPendingState(placed.state);
          setPendingLog(log);
          pendingApplyRef.current = { pushHistory: true, clearRedo: true };
        } else if (attempt < 3) {
          console.debug('[FLY place] retry attempt=%d origin?%s dest?%s', attempt, !!originRect, !!destRect);
          requestAnimationFrame(() => tryAnimatePlace(attempt + 1));
        } else {
          console.debug('[FLY place] fallback without animation');
          // Fallback: if we still fail to measure, update immediately
          setAppearKeys(new Set([key]));
          updateAndCheck(placed.state, true, true, log);
        }
      };

      requestAnimationFrame(() => tryAnimatePlace(1));
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
      const imgSrc = filler === 'L' ? bolaB : bolaA;

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
    }, Math.max(0, autoFillDelayMs));

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
    setMoves([]);
    setRedoMoves([]);
    setVsAI(null);
    logSnapshot(init, 'Nuevo juego — tablero inicial');
  };

  // Disable AI when we are navigating the past (redo has entries) in Vs IA mode.
  const atPresent = redo.length === 0;
  // AI logic hook
  const {
    iaBusy,
    aiDisabled,
    iaAutoplay,
    setIaAutoplay,
    iaProgress,
    iaEval,
    iaDepthReached,
    iaPV,
    iaRootMoves,
    iaNodes,
    iaElapsedMs,
    iaNps,
    iaRootPlayer,
    onAIMove,
  } = useAI({
    state,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
    iaConfig,
    vsAI,
    atPresent,
    gameOver,
    flying,
    autoRunningRef,
    reserveLightRef,
    reserveDarkRef,
    redoingRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
    historyStates: history,
  });
  // Undo/Redo availability flags (used in board actions panel)
  const canUndo = history.length > 0 && !flying && !autoRunningRef.current && !iaBusy;

  // Compute concise winner label for modal: "Ganador: Humano/IA"
  const winnerMessage = useMemo(() => {
    if (!gameOver) return '';
    const over = isGameOver(state);
    if (!over.over || !over.winner) return '';
    if (vsAI) {
      const label = over.winner === vsAI.enemy ? 'IA' : 'Humano';
      try { console.info('[winnerMessage] VsAI mode', { winner: over.winner, enemy: vsAI.enemy, label }); } catch {}
      return `Ganador: ${label}`;
    }
    // Fallback fuera de modo Vs IA: infer from last move source
    // If the last recorded move was done by the AI helper, show IA; otherwise Humano.
    const last = moves.length > 0 ? moves[moves.length - 1] : null;
    let label: 'IA' | 'Humano' = 'Humano';
    if (last?.source === 'IA') label = 'IA';
    // If the game ended via auto-completion, clarify by side color to avoid confusion.
    if (last?.source === 'AUTO') {
      const side = over.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)';
      try { console.info('[winnerMessage] AUTO completion', { winner: over.winner, side }); } catch {}
      return `Ganador: ${side}`;
    }
    try { console.info('[winnerMessage] Non VsAI mode', { lastSource: last?.source, inferred: label, winner: over.winner }); } catch {}
    return `Ganador: ${label}`;
  }, [gameOver, state, vsAI, moves]);

  const onFinishRecovery = () => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state, true, true, { player: state.currentPlayer, source: 'PLAYER', text: 'fin recuperación' });
  };

  // === InfoIA mirroring callbacks (fast, no animations) ===
  const onMirrorStart = () => {
    try { setFlying(null); } catch {}
    mirrorPrevStateRef.current = state;
    autoRunningRef.current = true; // temporarily block user interactions
  };
  const onMirrorUpdate = (s: GameState) => {
    try { setFlying(null); } catch {}
    setState(s);
  };
  const onMirrorEnd = (_s: GameState) => {
    try { setFlying(null); } catch {}
    // Restore original board when finished
    if (mirrorPrevStateRef.current) {
      setState(mirrorPrevStateRef.current);
      mirrorPrevStateRef.current = null;
    }
    autoRunningRef.current = false;
  };

  const onStartVsAI = (enemy: 'L' | 'D', depth: number) => {
    setGameOver(undefined);
    const init = initialState();
    const initAdjusted = { ...init, currentPlayer: 'L' as 'L' | 'D' };
    setState(initAdjusted);
    setHistory([]);
    setRedo([]);
    setMoves([]);
    setRedoMoves([]);
    setIaDepth(depth);
    setVsAI({ enemy, depth });
    setShowIAUser(false);
    logSnapshot(initAdjusted, `Nuevo juego vs IA — enemigo ${enemy === 'L' ? 'Naranja (L)' : 'Marrón (D)'} — dificultad ${depth}`);
  };

  // During a flying animation, use the pending state's reserves so the UI counter updates immediately
  const reservesForDisplay = (flying && pendingState) ? pendingState.reserves : state.reserves;

  return (
    <div className="app">
      <HeaderPanel
        onNewGame={onNewGame}
        showTools={showTools}
        onToggleDev={() => setShowTools((v) => !v)}
        showIA={showIAUser}
        onToggleIA={() => setShowIAUser((v) => !v)}
        showIAToggle={true}
        showDevToggle={false}
        onStartVsAI={onStartVsAI}
      />
      {showIAUser && (
        <IAUserPanel
          depth={iaDepth}
          onChangeDepth={setIaDepth}
          onAIMove={onAIMove}
          disabled={aiDisabled || iaBusy}
          aiAutoplayActive={iaAutoplay}
          onToggleAiAutoplay={() => {
            // toggle autoplay (timer is handled inside useAI)
            setIaAutoplay((v) => !v);
          }}
        />
      )}
      {showRules && (
        <RulesPanel />
      )}
      <div className="content">
        <InfoPanel
          state={state}
          aiEnemy={vsAI?.enemy ?? null}
          aiLastMove={lastIaMove}
          aiThinking={iaBusy}
          reservesOverride={reservesForDisplay}
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
          noShade={noShadeEffective}
          shadeOnlyHoles={shadeOnlyHoles}
          showHoleBorders={holeBorders}
        />
        {/* Board actions: Undo only (icon button) */}
        <div className="panel board-actions" role="group" aria-label="Acciones del tablero">
          <div className="row actions">
            <button
              className="undo-btn"
              disabled={!canUndo}
              onClick={onUndo}
              aria-label="Deshacer última jugada"
              title="Deshacer"
            >
              <svg className="header-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 5 4 12l7 7v-4h5a4 4 0 0 0 0-8h-5V5z"/></svg>
              <span className="sr-only">Deshacer</span>
            </button>
            {state.phase === 'recover' && (
              <div style={{ marginLeft: 'auto', display: 'inline-flex' }}>
                <button
                  className="finish-recovery"
                  onClick={onFinishRecovery}
                  aria-label="Terminar recuperación"
                  title="Terminar recuperación"
                >
                  <svg className="header-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    {/* Bola tachada: usa currentColor para heredar el blanco del botón */}
                    <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.12" />
                    <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth={1.8} />
                    <path d="M5 19 L19 5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                  
                </button>
              </div>
            )}
          </div>
        </div>
        {showHistory && (
          <MoveLog moves={moves} />
        )}
        {showFases && (
          <FasePanel state={state} gameOverText={gameOver} />
        )}
        {showTools && (
          <DevToolsPanel
            onToggleRules={() => setShowRules((v) => !v)}
            showIA={showIATools}
            onToggleIA={() => setShowIATools((v) => !v)}
            showInfoIA={showInfoIA}
            onToggleInfoIA={() => setShowInfoIA((v) => !v)}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory((v) => !v)}
            showFases={showFases}
            onToggleFases={() => setShowFases((v) => !v)}
            showUX={showUX}
            onToggleUX={() => setShowUX((v) => !v)}
            fullWidth
            iaPanel={(
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
                aiAutoplayActive={iaAutoplay}
                onToggleAiAutoplay={() => {
                  setIaAutoplay((v) => !v);
                }}
                iaConfig={iaConfig}
                onChangeIaConfig={(patch) => setIaConfig((prev) => ({ ...prev, ...patch }))}
              />
            )}
            infoIAPanel={(
              <InfoIA
                onMirrorStart={onMirrorStart}
                onMirrorUpdate={onMirrorUpdate}
                onMirrorEnd={onMirrorEnd}
              />
            )}
            uxPanel={(
              <UXPanel
                noShadeL0={noShade[0]}
                noShadeL1={noShade[1]}
                noShadeL2={noShade[2]}
                noShadeL3={noShade[3]}
                onChangeNoShade={(level, value) => setNoShade((prev) => ({ ...prev, [level]: value }))}
                shadeOnlyAvailable={shadeOnlyAvailable}
                onToggleShadeOnlyAvailable={setShadeOnlyAvailable}
                shadeOnlyHoles={shadeOnlyHoles}
                onToggleShadeOnlyHoles={setShadeOnlyHoles}
                holeBorders={holeBorders}
                onToggleHoleBorders={setHoleBorders}
                pieceScale={pieceScale}
                onChangePieceScale={setPieceScale}
                appearMs={animAppearMs}
                flashMs={animFlashMs}
                flyMs={animFlyMs}
                onChangeAppearMs={setAnimAppearMs}
                onChangeFlashMs={setAnimFlashMs}
                onChangeFlyMs={setAnimFlyMs}
                autoFillDelayMs={autoFillDelayMs}
                onChangeAutoFillDelayMs={setAutoFillDelayMs}
              />
            )}
          />
        )}
        {gameOver && winnerMessage && (
          <GameOverModal message={winnerMessage} onConfirm={onNewGame} />
        )}
      </div>
      {flying && (
        <FlyingPiece
          from={flying.from}
          to={flying.to}
          imgSrc={flying.imgSrc}
          durationMs={animFlyMs}
          onDone={() => {
            // Primero retiramos el clon volador para evitar doble render (flicker)
            setFlying(null);
            // Luego aplicamos el nuevo estado del tablero
            if (pendingState) {
              const { pushHistory, clearRedo } = pendingApplyRef.current;
              updateAndCheck(pendingState, pushHistory, clearRedo, pendingLog ?? undefined);
            }
            // Tras aplicar estado, si hay appear pendiente (redo de colocar/subir), dispararlo ahora
            if (lastAppearKeyRef.current) {
              setAppearKeys(new Set([lastAppearKeyRef.current]));
            }
            lastAppearKeyRef.current = "";
            setPendingState(null);
            setPendingLog(null);
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
            // Any flying animation end (including redo) — allow AI again
            redoingRef.current = false;
          }}
        />
      )}
      <FootPanel
        showTools={showTools}
        onToggleDev={() => setShowTools((v) => !v)}
      />
    </div>
  );
}

export default App;
