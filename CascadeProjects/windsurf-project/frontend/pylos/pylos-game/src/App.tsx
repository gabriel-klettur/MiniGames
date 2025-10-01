import { useEffect, useRef, useState } from 'react';
// Board and InfoPanel are now used via GameView
import GameView from './components/GameView';
import HeaderPanel from './components/HeaderPanel';
import FasePanel from './components/DevTools/FasePanel/FasePanel';
import InfoIA from './components/DevTools/InfoIA/InfoIA';
import DevToolsOrchestrator from './components/DevTools/DevToolsOrchestrator';
import RulesPanel from './components/DevTools/RulesPanel/RulesPanel';
import { useGameLogger } from './hooks/useGameLogger';
import type { GameState } from './game/types';
import { posKey } from './game/board';
import FlyingPiece from './components/FlyingPiece';
import HistoryPanel from './components/HistoryPanel';
import UndoRedo from './components/UndoRedo';
import IAPanel from './components/DevTools/IAPanel/index';
import IAUserPanel from './components/IAUserPanel/IAUserPanel';
import FootPanel from './components/FootPanel';
import UXPanel from './components/DevTools/UXPanel/UXPanel';
import GameOverModal from './components/GameOverModal';
import { usePersistence } from './hooks/usePersistence';
import type { MoveEntry } from './hooks/usePersistence';
import { useAnimations } from './hooks/useAnimations';
import { useHistoryLogic } from './hooks/useHistory';
import { useAI } from './hooks/useAI';
import {
  useIaAdvancedConfig,
  useAutoFill,
  useBoardInteractions,
  useMirrorPreview,
  useWinnerMessage,
  useGameLifecycle,
  useHighlights,
  useReservesDisplay,
  useUpdateAndCheck,
  useExportHistory,
  useUIPanels,
  useLayoutStyle,
  useAvailableLevels,
  useShadeConfig,
  useHistoryUI,
} from './hooks/app';
import { useFlyingDone } from './hooks/app/useFlyingDone';

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
    finishedGames,
    setFinishedGames,
  } = usePersistence();
  // History stacks managed by useHistoryLogic (initialized later)
  let history: GameState[] = [];
  let setHistory: React.Dispatch<React.SetStateAction<GameState[]>>;
  let redo: GameState[] = [];
  let setRedo: React.Dispatch<React.SetStateAction<GameState[]>>;
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);
  // Track whether current finished game has been archived (to avoid duplicates)
  const archivedRef = useRef<boolean>(false);
  // Local redo moves stack setter (used by updateAndCheck to clear redo)
  const [, setRedoMoves] = useState<MoveEntry[]>([]);
  // Centralizar toggles de paneles en un hook dedicado
  const {
    showTools, toggleTools,
    showIATools, toggleIATools,
    showHistory, toggleHistory,
    showFases, toggleFases,
    showRules, toggleRules,
    showInfoIA, toggleInfoIA,
    showUX, toggleUX,
  } = useUIPanels();
  // IA advanced configuration (persisted)
  const [iaConfig, setIaConfig] = useIaAdvancedConfig();
  const { logSnapshot } = useGameLogger(state);
  // Centralized state transition handler (history/redo/log/archive + game over)
  const updateAndCheck = useUpdateAndCheck({
    state,
    moves,
    vsAI,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
    archivedRef,
    setState,
    setHistory: (v) => setHistory(v),
    setRedo: (v) => setRedo(v),
    setMoves,
    setRedoMoves,
    setFinishedGames,
    setGameOver,
    logSnapshot,
  });

  // Ref to the current player's piece icon in the InfoPanel (animation origin)
  const currentPieceRef = useRef<HTMLSpanElement | null>(null);
  // Refs for reserve icons in InfoPanel (left: L, right: D)
  const reserveLightRef = useRef<HTMLSpanElement | null>(null);
  const reserveDarkRef = useRef<HTMLSpanElement | null>(null);
  // Auto-completion running flag (timer handled inside useAutoFill)
  const autoRunningRef = useRef<boolean>(false);
  // IA autoplay timer is managed inside useAI

  // archivedRef defined above

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
    hiddenKeys,
    setHiddenKeys,
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
  const flashKeys: Set<string> = getFlashKeys(state);
  // Removed lastIaMove usage: InfoPanel switches icons based on aiEnemy only

  // IA control por color (persisten durante la partida actual)
  const [aiControlL, setAiControlL] = useState<boolean>(false);
  const [aiControlD, setAiControlD] = useState<boolean>(false);

  // === UI/UX CONFIG STATE === (visibilidad vía useUIPanels)
  // Pausa entre pasos de autocolocación final (ms) gestionada por hook
  // Valor y setter provienen de useAutoFill más abajo

  // Calcular niveles disponibles y sombreado efectivo (extraído a hooks)
  const availableLevels = useAvailableLevels(state.board);
  const noShadeEffective = useShadeConfig(availableLevels, shadeOnlyAvailable, noShade as { 0: boolean; 1: boolean; 2: boolean; 3: boolean });

  // CSS variables are synchronized inside useAnimations hook

  // Persistence handled by usePersistence

  // (was inline) now provided by useUpdateAndCheck

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

  // Wrap onNewGame to reset archived flag
  const handleNewGame = () => {
    archivedRef.current = false;
    onNewGame();
    // Resetear control por color al iniciar nueva partida
    setAiControlL(false);
    setAiControlD(false);
  };

  // Download/Clear history extracted into a hook
  const { downloadCurrentGame, clearHistory } = useExportHistory({
    state,
    moves,
    finishedGames,
    setMoves,
    setFinishedGames,
    vsAI,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
  });
  const clearHistoryAll = () => {
    clearHistory();
    // Allow archiving the next finished game again
    archivedRef.current = false;
  };
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

  // Envolver inicio Vs IA para limpiar toggles de control por color
  const onStartVsAIWrapped = (enemy: 'L' | 'D', depth: number) => {
    setAiControlL(false);
    setAiControlD(false);
    onStartVsAI(enemy, depth);
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
  // Undo UI logic encapsulated in a hook
  const { canUndo, onUndoClick, flushQueuedUndo } = useHistoryUI({
    historyLength: history.length,
    autoRunningRef,
    iaBusy,
    flying,
    onUndo,
  });

  // Compute concise winner label for modal: "Ganador: Humano/IA"
  const winnerMessage = useWinnerMessage(gameOver, state, moves, vsAI);

  // onFinishRecovery provided by useBoardInteractions

  // Último actor por lado (ai/human) segun historial de movimientos
  const lastActorL: 'ai' | 'human' = (() => {
    for (let i = moves.length - 1; i >= 0; i--) {
      const m = moves[i];
      if (m.player === 'L') return m.source === 'IA' ? 'ai' : 'human';
    }
    return 'human';
  })();
  const lastActorD: 'ai' | 'human' = (() => {
    for (let i = moves.length - 1; i >= 0; i--) {
      const m = moves[i];
      if (m.player === 'D') return m.source === 'IA' ? 'ai' : 'human';
    }
    return 'human';
  })();

  // Auto-movimiento cuando IA controla un color específico (L/D) mediante los toggles del panel de usuario.
  // Se evita duplicar la lógica cuando está activo el modo Vs IA para ese color (en cuyo caso ya lo gestiona useAI).
  useEffect(() => {
    if (gameOver) return;
    if (!atPresent) return;
    if (iaBusy || aiDisabled) return;
    const cur = state.currentPlayer;
    const aiShouldPlay = (cur === 'L' && aiControlL) || (cur === 'D' && aiControlD);
    if (!aiShouldPlay) return;
    if (vsAI && vsAI.enemy === cur) return; // Evitar doble disparo; Vs IA ya mueve
    const t = setTimeout(() => { void onAIMove(); }, 50);
    return () => clearTimeout(t);
  }, [aiControlL, aiControlD, state.currentPlayer, iaBusy, aiDisabled, atPresent, gameOver, vsAI, onAIMove]);

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

  // When a lift animation starts, hide the origin cell shortly after (100–200ms)
  useEffect(() => {
    if (!flying) {
      // Clear any temporary hidden cells at the end of animations
      setHiddenKeys(new Set());
      return;
    }
    if (flying.srcKey) {
      const t = window.setTimeout(() => {
        setHiddenKeys((prev) => {
          const next = new Set(prev);
          next.add(flying.srcKey!);
          return next;
        });
      }, 150);
      return () => window.clearTimeout(t);
    }
  }, [flying, setHiddenKeys]);

  const layoutStyle = useLayoutStyle(showTools, showInfoIA);
  // FlyingPiece onDone logic extracted to a hook (keeps App as orchestrator)
  const onFlyingDone = useFlyingDone({
    pendingState,
    pendingLog,
    pendingApplyRef,
    lastAppearKeyRef,
    setAppearKeys,
    setPendingState,
    setPendingLog,
    setFlying,
    redoingRef,
    onUndo,
    updateAndCheck,
    overlapMs: 250,
    afterClear: () => { flushQueuedUndo(); },
  });

  return (
    <div className="app" style={layoutStyle}>
      <HeaderPanel
        onNewGame={handleNewGame}
        showTools={showTools}
        onToggleDev={toggleTools}
        showIA={showIAUser}
        onToggleIA={() => setShowIAUser((v) => !v)}
        showIAToggle={true}
        showDevToggle={false}
        onStartVsAI={onStartVsAIWrapped}
        showHistory={showHistory}
        onToggleHistory={toggleHistory}
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
          aiControlL={aiControlL}
          aiControlD={aiControlD}
          onToggleAiControlL={() => setAiControlL((v) => !v)}
          onToggleAiControlD={() => setAiControlD((v) => !v)}
        />
      )}
      {showRules && (
        <RulesPanel />
      )}
      <div className="content">
        <GameView
          state={state}
          aiEnemy={vsAI?.enemy ?? null}
          aiThinking={iaBusy}
          aiThinkingSide={iaBusy ? (iaRootPlayer ?? null) : null}
          aiControlL={aiControlL}
          aiControlD={aiControlD}
          lastActorL={lastActorL}
          lastActorD={lastActorD}
          reservesOverride={reservesForDisplay}
          currentPieceRef={currentPieceRef}
          reserveLightRef={reserveLightRef}
          reserveDarkRef={reserveDarkRef}
          onCellClick={onCellClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          highlights={highlights}
          selected={state.selectedSource ?? undefined}
          posKey={posKey}
          appearKeys={appearKeys}
          flashKeys={flashKeys}
          noShade={noShadeEffective}
          shadeOnlyHoles={shadeOnlyHoles}
          showHoleBorders={holeBorders}
          hiddenKeys={hiddenKeys}
        />
        <UndoRedo
          canUndo={canUndo}
          onUndo={onUndoClick}
          showFinishRecovery={state.phase === 'recover'}
          onFinishRecovery={onFinishRecovery}
        />
        <HistoryPanel visible={showHistory} moves={moves} finishedGames={finishedGames} onDownload={downloadCurrentGame} onClear={clearHistoryAll} />
        {showFases && (
          <FasePanel state={state} gameOverText={gameOver} />
        )}
        <DevToolsOrchestrator
          showTools={showTools}
          toggleRules={toggleRules}
          showIATools={showIATools}
          toggleIATools={toggleIATools}
          showInfoIA={showInfoIA}
          toggleInfoIA={toggleInfoIA}
          showHistory={showHistory}
          toggleHistory={toggleHistory}
          showFases={showFases}
          toggleFases={toggleFases}
          showUX={showUX}
          toggleUX={toggleUX}
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
          infoIAPanel={(<InfoIA onMirrorStart={onMirrorStart} onMirrorUpdate={onMirrorUpdate} onMirrorEnd={onMirrorEnd} />)}
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
        {gameOver && winnerMessage && (
          <GameOverModal message={winnerMessage} onConfirm={handleNewGame} />
        )}
      </div>
      {flying && (
        <FlyingPiece
          from={flying.from}
          to={flying.to}
          imgSrc={flying.imgSrc}
          durationMs={animFlyMs}
          onDone={onFlyingDone}
        />
      )}
      <FootPanel
        showTools={showTools}
        onToggleDev={toggleTools}
      />
    </div>
  );
}

export default App;
