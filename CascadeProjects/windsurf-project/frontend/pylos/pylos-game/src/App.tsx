import { useMemo, useRef, useState } from 'react';
import Board from './components/Board';
import InfoPanel from './components/InfoPanel';
import HeaderPanel from './components/HeaderPanel';
import FasePanel from './components/DevTools/FasePanel/FasePanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import InfoIA from './components/DevTools/InfoIA/InfoIA';
import RulesPanel from './components/DevTools/RulesPanel/RulesPanel';
import { useGameLogger } from './hooks/useGameLogger';
import type { GameState } from './game/types';
import { posKey, positions, isSupported } from './game/board';
import FlyingPiece from './components/FlyingPiece';
import HistoryPanel from './components/HistoryPanel';
import UndoRedo from './components/UndoRedo';
import IAPanel from './components/DevTools/IAPanel/index';
import IAUserPanel from './components/IAUserPanel';
import FootPanel from './components/FootPanel';
import UXPanel from './components/DevTools/UXPanel/UXPanel';
import GameOverModal from './components/GameOverModal';
import { usePersistence } from './hooks/usePersistence';
import type { MoveEntry } from './hooks/usePersistence';
import { useAnimations } from './hooks/useAnimations';
import { useHistoryLogic } from './hooks/useHistory';
import { useAI } from './hooks/useAI';
import { isGameOver } from './game/rules';
import {
  useIaAdvancedConfig,
  useAutoFill,
  useBoardInteractions,
  useMirrorPreview,
  useWinnerMessage,
  useGameLifecycle,
  useHighlights,
  useReservesDisplay,
} from './hooks/app';

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
  // IA advanced configuration (persisted)
  const [iaConfig, setIaConfig] = useIaAdvancedConfig();
  const { logSnapshot } = useGameLogger(state);
  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);
  // Refs for reserve icons in InfoPanel (left: L, right: D)
  const reserveLightRef = useRef<HTMLSpanElement | null>(null);
  const reserveDarkRef = useRef<HTMLSpanElement | null>(null);
  // Auto-completion running flag (timer handled inside useAutoFill)
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
  
  const highlights: Set<string> = useHighlights(state, gameOver);

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
  // Pausa entre pasos de autocolocación final (ms) gestionada por hook
  // Valor y setter provienen de useAutoFill más abajo

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


  // Board interactions via hook
  const { onCellClick, onDragStart, onDragEnd, onFinishRecovery } = useBoardInteractions({
    state,
    gameOver,
    flying,
    autoRunningRef,
    currentPieceRef,
    reserveLightRef,
    reserveDarkRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
  });

  // Auto-complete pyramid via dedicated hook
  const { autoFillDelayMs, setAutoFillDelayMs } = useAutoFill({
    state,
    gameOver,
    flying,
    autoRunningRef,
    reserveLightRef,
    reserveDarkRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
  });

  const { onNewGame, onStartVsAI } = useGameLifecycle({
    setState,
    setHistory,
    setRedo,
    setMoves,
    setRedoMoves,
    setVsAI,
    setIaDepth,
    setShowIAUser,
    setGameOver,
    logSnapshot,
  });

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
  const winnerMessage = useWinnerMessage(gameOver, state, moves, vsAI);

  // onFinishRecovery provided by useBoardInteractions

  // === InfoIA mirroring callbacks (fast, no animations) ===
  const { onMirrorStart, onMirrorUpdate, onMirrorEnd } = useMirrorPreview({
    state,
    setState,
    setFlying,
    autoRunningRef,
  });

  // onStartVsAI provided by useGameLifecycle

  // During a flying animation, use the pending state's reserves so the UI counter updates immediately
  const reservesForDisplay = useReservesDisplay(state, flying, pendingState);

  return (
    <div
      className="app"
      style={
        (showTools && showInfoIA)
          ? ({
            // Tamaño general del tablero
            ['--board-scale' as any]: '1.25',
            
            ['--ball-scale' as any]: '0.5',      // Restaurar tamaño completo de bolas cuando InfoIA está abierto                        
            ['--hole-scale' as any]: '0.5',      // 0.85..1.05 para afinar            

            ['--ball-matrix-scale' as any]: '0.75',  // 0.5 = la matriz ocupa la mitad
            ['--hole-matrix-scale' as any]: '0.75',

            } as React.CSSProperties)
          : undefined
      }
    >
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
        {/** InfoPanel is now rendered inside the conditional wrapper below to allow size overrides */}
        {/**
         * While the InfoIA panel is visible, reduce the board size to half and
         * also shrink InfoPanel piece icons. When InfoIA is hidden, render both
         * components without overrides so base styles apply.
         */}
        {(showTools && showInfoIA) ? (
          <div>
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
          </div>
        ) : (
          <>
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
          </>
        )}
        <UndoRedo
          canUndo={canUndo}
          onUndo={onUndo}
          showFinishRecovery={state.phase === 'recover'}
          onFinishRecovery={onFinishRecovery}
        />
        <HistoryPanel visible={showHistory} moves={moves} />
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
