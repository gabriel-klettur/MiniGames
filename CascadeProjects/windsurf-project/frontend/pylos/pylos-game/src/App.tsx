import { useMemo, useRef, useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import InfoPanel from './components/InfoPanel';
import HeaderPanel from './components/HeaderPanel';
import FasePanel from './components/FasePanel';
import DevToolsPanel from './components/DevToolsPanel';
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
import { computeBestMoveAsync } from './ia';
import { applyMove } from './ia/moves';
import type { AIMove } from './ia/moves';
import FootPanel from './components/FootPanel';
import UXPanel from './components/UXPanel';
import GameOverModal from './components/GameOverModal';

// LocalStorage keys for persistence
const LS_KEYS = {
  game: 'pylos.game.v1',
  moves: 'pylos.moves.v1',
  vsai: 'pylos.vsai.v1',
  ia: 'pylos.ia.config.v1',
  iaShow: 'pylos.ia.showUser.v1',
} as const;

function App() {
  type MoveEntry = { player: 'L' | 'D'; source: 'PLAYER' | 'IA' | 'AUTO'; text: string };
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.game);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Basic shape validation
        if (parsed && typeof parsed === 'object' && parsed.board && parsed.reserves && parsed.currentPlayer) {
          return parsed as GameState;
        }
      }
    } catch {}
    return initialState();
  });
  // History stack for undo: stores previous states
  const [history, setHistory] = useState<GameState[]>([]);
  // Redo stack: states that can be re-applied after an undo
  const [redo, setRedo] = useState<GameState[]>([]);
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  // Dev/tools toggle and Rules panel toggle
  const [showTools, setShowTools] = useState<boolean>(false);
  // IA panel toggles y parámetros (separados User vs DevTools)
  const [showIAUser, setShowIAUser] = useState<boolean>(() => {
    try { const raw = localStorage.getItem(LS_KEYS.iaShow); if (raw != null) return raw === 'true'; } catch {}
    return false;
  });     // IAUserPanel bajo el header
  const [showIATools, setShowIATools] = useState<boolean>(false);   // IAPanel dentro de DevToolsPanel
  // Historial de movimientos (inicialmente oculto)
  const [showHistory, setShowHistory] = useState<boolean>(false);
  // FasePanel (inicialmente oculto)
  const [showFases, setShowFases] = useState<boolean>(false);
  const [iaDepth, setIaDepth] = useState<number>(() => {
    try { const raw = localStorage.getItem(LS_KEYS.ia); if (raw) { const p = JSON.parse(raw); if (typeof p?.depth === 'number') return p.depth; } } catch {}
    return 3;
  });
  const [iaTimeMode, setIaTimeMode] = useState<'auto' | 'manual'>(() => {
    try { const raw = localStorage.getItem(LS_KEYS.ia); if (raw) { const p = JSON.parse(raw); if (p?.timeMode === 'auto' || p?.timeMode === 'manual') return p.timeMode; } } catch {}
    return 'manual';
  });
  const [iaTimeSeconds, setIaTimeSeconds] = useState<number>(() => {
    try { const raw = localStorage.getItem(LS_KEYS.ia); if (raw) { const p = JSON.parse(raw); if (typeof p?.timeSeconds === 'number') return p.timeSeconds; } } catch {}
    return 8;
  });
  const [showRules, setShowRules] = useState<boolean>(false);
  // VS IA configuration (null = normal mode)
  const [vsAI, setVsAI] = useState<null | { enemy: 'L' | 'D'; depth: number }>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.vsai);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && (p.enemy === 'L' || p.enemy === 'D') && typeof p.depth === 'number') return p as { enemy: 'L' | 'D'; depth: number };
      }
    } catch {}
    return null;
  });
  const { logSnapshot } = useGameLogger(state);
  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);
  // Refs for reserve icons in InfoPanel (left: L, right: D)
  const reserveLightRef = useRef<HTMLSpanElement | null>(null);
  const reserveDarkRef = useRef<HTMLSpanElement | null>(null);
  // Auto-completion control: timer and running flag
  const autoTimerRef = useRef<number | null>(null);
  const autoRunningRef = useRef<boolean>(false);
  // IA autoplay (Play/Stop) timer
  const iaAutoTimerRef = useRef<number | null>(null);
  const [iaAutoplay, setIaAutoplay] = useState<boolean>(false);

  // Flying animation state (only for placing from reserve or recover)
  type Rect = { left: number; top: number; width: number; height: number };
  const [flying, setFlying] = useState<null | { from: Rect; to: Rect; imgSrc: string; destKey: string }>(null);
  const [pendingState, setPendingState] = useState<GameState | null>(null);
  const [pendingLog, setPendingLog] = useState<MoveEntry | null>(null);
  const pendingApplyRef = useRef<{ pushHistory: boolean; clearRedo: boolean }>({ pushHistory: true, clearRedo: true });
  // Flag to indicate a redo operation is in progress (used to pause AI autoplay)
  const redoingRef = useRef<boolean>(false);
  // Track appear destination to trigger appear animation exactly after state applies
  const lastAppearKeyRef = useRef<string>("");

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
  const [moves, setMoves] = useState<MoveEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.moves);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list as MoveEntry[];
      }
    } catch {}
    return [];
  });
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
  // Sombreado por nivel (true = ocultar sombreado)
  const [noShade, setNoShade] = useState<{ 0: boolean; 1: boolean; 2: boolean; 3: boolean }>({ 0: false, 1: false, 2: false, 3: false });
  // Tamaño de bola (escala)
  const [pieceScale, setPieceScale] = useState<number>(1.55);
  // Duraciones de animación (ms)
  const [animAppearMs, setAnimAppearMs] = useState<number>(280);
  const [animFlashMs, setAnimFlashMs] = useState<number>(900);
  const [animFlyMs, setAnimFlyMs] = useState<number>(900);
  // Modo: sombreado solo en niveles disponibles (ON por defecto)
  const [shadeOnlyAvailable, setShadeOnlyAvailable] = useState<boolean>(true);
  // Modo: sombreado solo en huecos soportados (vacíos) (ON por defecto)
  const [shadeOnlyHoles, setShadeOnlyHoles] = useState<boolean>(true);
  // Mostrar borde blanco en huecos disponibles (OFF por defecto)
  const [holeBorders, setHoleBorders] = useState<boolean>(false);
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

  // Sincronizar variables CSS globales (duraciones y escala)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--piece-scale', String(pieceScale));
    root.style.setProperty('--anim-appear-ms', `${Math.max(0, animAppearMs)}ms`);
    root.style.setProperty('--anim-flash-ms', `${Math.max(0, animFlashMs)}ms`);
  }, [pieceScale, animAppearMs, animFlashMs]);

  // === Persistence: save to localStorage on change ===
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.game, JSON.stringify(state)); } catch {}
  }, [state]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.moves, JSON.stringify(moves)); } catch {}
  }, [moves]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.vsai, JSON.stringify(vsAI)); } catch {}
  }, [vsAI]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.ia, JSON.stringify({ depth: iaDepth, timeMode: iaTimeMode, timeSeconds: iaTimeSeconds })); } catch {}
  }, [iaDepth, iaTimeMode, iaTimeSeconds]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.iaShow, String(showIAUser)); } catch {}
  }, [showIAUser]);

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

  // Undo last move: restore previous state from history WITH animation when possible
  const onUndo = () => {
    if (flying || autoRunningRef.current) return;
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const lastLog = moves.length > 0 ? moves[moves.length - 1] : undefined;

    // Update stacks
    setHistory((h) => h.slice(0, -1));
    setRedo((r) => [...r, state]);
    if (lastLog) {
      setRedoMoves((rm) => [...rm, lastLog]);
      setMoves((m) => m.slice(0, -1));
    }

    // Try to animate inverse of lastLog
    let fromRect: Rect | null = null;
    let toRect: Rect | null = null;
    let imgSrc = state.currentPlayer === 'L' ? bolaB : bolaA; // default; will use lastLog.player if present
    let appearKey = '';
    if (lastLog) {
      const p = lastLog.player;
      imgSrc = p === 'L' ? bolaB : bolaA;
      if (lastLog.text.startsWith('colocar ')) {
        const key = lastLog.text.replace('colocar ', '').trim();
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const srcRect = srcBtn?.getBoundingClientRect();
        const destEl = p === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const destRect = destEl?.getBoundingClientRect();
        if (srcRect && destRect) {
          fromRect = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          toRect = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          appearKey = key; // harmless; appear after removal
        }
      } else if (lastLog.text.startsWith('subir ')) {
        // format: subir src -> dest
        const rest = lastLog.text.replace('subir ', '').trim();
        const [src, dst] = rest.split('->').map((s) => s.trim());
        const dstBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${dst}"]`);
        const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${src}"]`);
        const dRect = dstBtn?.getBoundingClientRect();
        const sRect = srcBtn?.getBoundingClientRect();
        if (dRect && sRect) {
          // Undo goes from dest back to src
          fromRect = { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height };
          toRect = { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height };
          appearKey = src;
        }
      } else if (lastLog.text.startsWith('recuperar ')) {
        const key = lastLog.text.replace('recuperar ', '').trim();
        const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
        const destRect = destBtn?.getBoundingClientRect();
        const srcEl = p === 'L' ? reserveLightRef.current : reserveDarkRef.current;
        const srcRect = srcEl?.getBoundingClientRect();
        if (srcRect && destRect) {
          // Undo recovery: bring piece back from reserve to board
          fromRect = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
          toRect = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
          appearKey = key;
        }
      }
    }

    if (fromRect && toRect) {
      setPendingState(prev);
      setPendingLog(null);
      // For UNDO animation we already updated history/redo stacks above
      pendingApplyRef.current = { pushHistory: false, clearRedo: false };
      setFlying({ from: fromRect, to: toRect, imgSrc, destKey: appearKey });
    } else {
      // Fallback: apply immediately without animation
      updateAndCheck(prev, false, false);
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
  const aiDisabled = !!gameOver || state.phase === 'recover' || !!flying || autoRunningRef.current || (!!vsAI && !atPresent);
  const [iaBusy, setIaBusy] = useState<boolean>(false);
  // Undo/Redo availability flags (used in board actions panel)
  const canUndo = history.length > 0 && !flying && !autoRunningRef.current && !iaBusy;
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
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          const nextState = applyMove(state, res.move);
          if (originRect && destRect) {
            const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `colocar ${key}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
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
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          const nextState = applyMove(state, res.move);
          if (srcRect && destRect) {
            const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
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

  // VS IA: si es turno de la IA, que juegue automáticamente (desactivado si autoplay manual está activo para evitar conflicto)
  useEffect(() => {
    if (!vsAI) return;                  // no estamos en modo vs IA
    if (iaAutoplay) return;             // si el usuario activó autoplay, evitamos doble disparo
    if (!atPresent) return;             // estamos en el pasado; no autojugar hasta volver al presente
    if (redoingRef.current) return;     // transición de redo en curso; evitar solapamientos
    if (gameOver) return;               // partida terminada
    if (iaBusy) return;                 // IA ya pensando
    if (aiDisabled) return;             // condiciones de UI impiden jugar ahora
    if (state.currentPlayer !== vsAI.enemy) return; // no es turno de la IA enemiga
    // Invocar IA en el siguiente tick para dejar que el DOM estabilice
    const t = setTimeout(() => {
      onAIMove();
    }, 50);
    return () => clearTimeout(t);
  }, [vsAI, atPresent, state.currentPlayer, iaBusy, aiDisabled, gameOver, iaAutoplay]);

  // IA autoplay manual: jugar cada ~2s mientras esté activo y condiciones lo permitan
  useEffect(() => {
    // limpiar cualquier timer pendiente al entrar/salir o al cambiar deps
    if (iaAutoTimerRef.current !== null) {
      clearTimeout(iaAutoTimerRef.current);
      iaAutoTimerRef.current = null;
    }

    if (!iaAutoplay) return;            // no activo

    if (gameOver) {
      // reflejar estado en el botón cuando termine la partida
      setIaAutoplay(false);
      return;
    }

    // no programar si IA está ocupada o UI lo impide (animando, recuperando, etc.)
    if (iaBusy || aiDisabled) return;

    // Programar siguiente jugada IA tras ~2s
    iaAutoTimerRef.current = window.setTimeout(() => {
      // Condiciones runtime: evitar disparos si algo cambió
      if (!iaAutoplay || gameOver) return;
      if (iaBusy || aiDisabled) return;
      onAIMove();
    }, 2000);

    return () => {
      if (iaAutoTimerRef.current !== null) {
        clearTimeout(iaAutoTimerRef.current);
        iaAutoTimerRef.current = null;
      }
    };
  }, [iaAutoplay, iaBusy, aiDisabled, gameOver, state.currentPlayer, flying]);

  // (auto-IA desactivada) — eliminamos auto-play automático para evitar confusión
  const onFinishRecovery = () => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state, true, true, { player: state.currentPlayer, source: 'PLAYER', text: 'fin recuperación' });
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
            // toggle y limpiar timer si corresponde
            setIaAutoplay((v) => {
              const next = !v;
              if (!next && iaAutoTimerRef.current !== null) {
                clearTimeout(iaAutoTimerRef.current);
                iaAutoTimerRef.current = null;
              }
              return next;
            });
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
                  setIaAutoplay((v) => {
                    const next = !v;
                    if (!next && iaAutoTimerRef.current !== null) {
                      clearTimeout(iaAutoTimerRef.current);
                      iaAutoTimerRef.current = null;
                    }
                    return next;
                  });
                }}
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
