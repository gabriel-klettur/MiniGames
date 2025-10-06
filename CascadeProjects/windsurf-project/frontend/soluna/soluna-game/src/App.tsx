import { useEffect, useRef } from 'react';
import './style/index.css';
import IAUserPanel from './components/IAUserPanel/IAUserPanel';
import HeaderPanel from './components/HeaderPanel/HeaderPanel';
import Board from './components/Board/Board';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import InfoIA from './components/DevTools/InfoIA';
import FasesPanel from './components/DevTools/FasesPanel';
import RulesPanel from './components/DevTools/RulesPanel';
import UIUX from './components/DevTools/UIUX/UIUX';
import IAPanel from './components/DevTools/IAPanel/IAPanel';
import InfoPanel from './components/InfoPanel';
import { useGame } from './game/store';
import { useLocalStorageBoolean } from './hooks/useLocalStorage';
import { useAiController } from './hooks/useAiController';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import { useSolunaHistory } from './hooks/useSolunaHistory';

function App() {
  const { state, dispatch } = useGame();
  const [showDev, setShowDev] = useLocalStorageBoolean('soluna:dev:show', false);
  const [showFases, setShowFases] = useLocalStorageBoolean('soluna:dev:showFases', false);
  const [showRules, setShowRules] = useLocalStorageBoolean('soluna:dev:showRules', false);
  const [showUX, setShowUX] = useLocalStorageBoolean('soluna:dev:showUX', false);
  const [showIA, setShowIA] = useLocalStorageBoolean('soluna:ui:showIA', true);
  const [showHistory, setShowHistory] = useLocalStorageBoolean('soluna:ui:showHistory', false);
  const [showIAPanel, setShowIAPanel] = useLocalStorageBoolean('soluna:dev:showIAPanel', false);
  const [showInfoIA, setShowInfoIA] = useLocalStorageBoolean('soluna:dev:showInfoIA', false);
  const {
    aiDepth, setAiDepth,
    aiTimeMode, setAiTimeMode,
    aiTimeSeconds, setAiTimeSeconds,
    aiAutoplay, setAiAutoplay,
    aiControlP1, setAiControlP1,
    aiControlP2, setAiControlP2,
    aiBusy, aiProgress, aiBusyElapsedMs,
    aiEval, aiPV, aiRootMoves, aiNodes, aiElapsed, aiNps, aiDepthReached,
    doAIMove,
    // Engine flags
    aiEnableTT, setAiEnableTT,
    aiFailSoft, setAiFailSoft,
    aiPreferHashMove, setAiPreferHashMove,
    aiEnableKillers, setAiEnableKillers,
    aiEnableHistory, setAiEnableHistory,
    aiEnablePVS, setAiEnablePVS,
    aiEnableAspiration, setAiEnableAspiration,
    aiAspirationDelta, setAiAspirationDelta,
    aiEnableQuiescence, setAiEnableQuiescence,
    aiQuiescenceDepth, setAiQuiescenceDepth,
    aiQuiescenceHighTowerThreshold, setAiQuiescenceHighTowerThreshold,
    // Adaptive time config (auto mode)
    aiTimeMinMs, setAiTimeMinMs,
    aiTimeMaxMs, setAiTimeMaxMs,
    aiTimeBaseMs, setAiTimeBaseMs,
    aiTimePerMoveMs, setAiTimePerMoveMs,
    aiTimeExponent, setAiTimeExponent,
  } = useAiController(state, dispatch);

  // Al abrir DevTools en móviles, hacer scroll al panel para que sea visible.
  const devToolsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (showDev && devToolsRef.current) {
      // Esperar al próximo tick para asegurar que el DOM esté pintado
      setTimeout(() => {
        const el = devToolsRef.current;
        if (!el) return;
        try {
          const rect = el.getBoundingClientRect();
          const y = rect.top + window.scrollY - 12; // pequeño margen superior
          window.scrollTo({ top: y, behavior: 'smooth' });
        } catch {
          // Fallback para navegadores sin smooth/scrollTo
          el.scrollIntoView();
        }
      }, 0);
    }
  }, [showDev]);

  // Historial de Soluna (moves + archivadas) con export/clear
  const { moves, finishedGames, downloadCurrentGame, clearHistory, clearMoves } = useSolunaHistory({ state, aiControlP1, aiControlP2 });
  return (
    <div className="app">
      <HeaderPanel
        showIA={showIA}
        onToggleIA={() => setShowIA((v) => !v)}
        onStartVsAI={(enemy, depth) => {
          // Reinicia la partida y configura IA con el estilo "Vs IA"
          clearMoves();
          dispatch({ type: 'reset-game' });
          setAiDepth(depth);
          setShowIA(true);
          // Activar control de IA para el lado enemigo seleccionado
          setAiControlP1(enemy === 1);
          setAiControlP2(enemy === 2);
        }}
        onNewGame={() => {
          // Limpieza explícita antes de iniciar nueva partida
          clearMoves();
          dispatch({ type: 'reset-game' });
        }}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
      />
      {/* Panel de usuario IA: centrado, estilo Pylos (toggleable desde header) */}
      {showIA && (
        <IAUserPanel
          depth={aiDepth}
          onChangeDepth={setAiDepth}
          onAIMove={doAIMove}
          disabled={state.roundOver || state.gameOver}
          aiAutoplayActive={aiAutoplay}
          onToggleAiAutoplay={() => setAiAutoplay((v) => !v)}
          aiControlP1={aiControlP1}
          aiControlP2={aiControlP2}
          onToggleAiControlP1={() => setAiControlP1((v) => !v)}
          onToggleAiControlP2={() => setAiControlP2((v) => !v)}
          busy={aiBusy}
          progress={aiProgress}
          busyElapsedMs={aiBusyElapsedMs}
        />
      )}
      {/* Badges/Jugadores: panel centrado */}
      <InfoPanel />
      {/* Contenido principal: siempre centrado */}
      <div className="content">
        <Board
          onNewGame={() => {
            clearMoves();
            dispatch({ type: 'reset-game' });
          }}
          onNewRound={() => {
            clearMoves();
            dispatch({ type: 'new-round' });
          }}
        />
        {/* DevTools a ancho completo, inmediatamente debajo del tablero */}
        {showDev && (
          <div className="devtools-row" ref={devToolsRef}>
            <div className="devtools-card">
              <DevToolsPanel
                showFases={showFases}
                onToggleFases={() => setShowFases((v) => !v)}
                showUX={showUX}
                onToggleUX={() => setShowUX((v) => !v)}
                onToggleRules={() => setShowRules((v) => !v)}
                showIAPanel={showIAPanel}
                onToggleIAPanel={() => setShowIAPanel((v) => !v)}
                showInfoIA={showInfoIA}
                onToggleInfoIA={() => setShowInfoIA((v) => !v)}
              />
              {showIAPanel && (
                <section className="devtools-card-section">
                  <div className="section-title">IA</div>
                  <IAPanel
                    state={state}
                    depth={aiDepth}
                    onChangeDepth={setAiDepth}
                    onAIMove={doAIMove}
                    disabled={state.roundOver || state.gameOver}
                    timeMode={aiTimeMode}
                    timeSeconds={aiTimeSeconds}
                    onChangeTimeMode={setAiTimeMode}
                    onChangeTimeSeconds={setAiTimeSeconds}
                    busy={aiBusy}
                    progress={aiProgress}
                    evalScore={aiEval}
                    depthReached={aiDepthReached}
                    pv={aiPV}
                    rootMoves={aiRootMoves}
                    nodes={aiNodes}
                    elapsedMs={aiElapsed}
                    nps={aiNps}
                    rootPlayer={state.currentPlayer}
                    moving={false}
                    aiAutoplayActive={aiAutoplay}
                    busyElapsedMs={aiBusyElapsedMs}
                    // Engine flags wiring
                    aiEnableTT={aiEnableTT}
                    onToggleAiEnableTT={() => setAiEnableTT(v => !v)}
                    aiFailSoft={aiFailSoft}
                    onToggleAiFailSoft={() => setAiFailSoft(v => !v)}
                    aiPreferHashMove={aiPreferHashMove}
                    onToggleAiPreferHashMove={() => setAiPreferHashMove(v => !v)}
                    aiEnablePVS={aiEnablePVS}
                    onToggleAiEnablePVS={() => setAiEnablePVS(v => !v)}
                    aiEnableAspiration={aiEnableAspiration}
                    onToggleAiEnableAspiration={() => setAiEnableAspiration(v => !v)}
                    aiAspirationDelta={aiAspirationDelta}
                    onChangeAiAspirationDelta={setAiAspirationDelta}
                    aiEnableKillers={aiEnableKillers}
                    onToggleAiEnableKillers={() => setAiEnableKillers(v => !v)}
                    aiEnableHistory={aiEnableHistory}
                    onToggleAiEnableHistory={() => setAiEnableHistory(v => !v)}
                    aiEnableQuiescence={aiEnableQuiescence}
                    onToggleAiEnableQuiescence={() => setAiEnableQuiescence(v => !v)}
                    aiQuiescenceDepth={aiQuiescenceDepth}
                    onChangeAiQuiescenceDepth={setAiQuiescenceDepth}
                    aiQuiescenceHighTowerThreshold={aiQuiescenceHighTowerThreshold}
                    onChangeAiQuiescenceHighTowerThreshold={setAiQuiescenceHighTowerThreshold}
                    aiTimeMinMs={aiTimeMinMs}
                    onChangeAiTimeMinMs={setAiTimeMinMs}
                    aiTimeMaxMs={aiTimeMaxMs}
                    onChangeAiTimeMaxMs={setAiTimeMaxMs}
                    aiTimeBaseMs={aiTimeBaseMs}
                    onChangeAiTimeBaseMs={setAiTimeBaseMs}
                    aiTimePerMoveMs={aiTimePerMoveMs}
                    onChangeAiTimePerMoveMs={setAiTimePerMoveMs}
                    aiTimeExponent={aiTimeExponent}
                    onChangeAiTimeExponent={setAiTimeExponent}
                  />
                </section>
              )}
              {showInfoIA && (
                <section className="devtools-card-section">
                  <div className="section-title">InfoIA (Simulación)</div>
                  <InfoIA />
                </section>
              )}
              {/* Secciones bajo los toggles */}
              {showRules && (
                <section className="devtools-card-section">
                  <div className="section-title">Reglas</div>
                  <RulesPanel />
                </section>
              )}
              {showFases && (
                <section className="devtools-card-section">
                  <div className="section-title">Fases</div>
                  <FasesPanel />
                </section>
              )}
              {showUX && (
                <section className="devtools-card-section">                
                  <UIUX />
                </section>
              )}
            </div>
          </div>
        )}
        <HistoryPanel
          visible={showHistory}
          moves={moves}
          finishedGames={finishedGames}
          onDownload={downloadCurrentGame}
          onClear={clearHistory}
        />
      </div>
      <button
        className={`dev-toggle-btn ${showDev ? 'active' : ''}`}
        onClick={() => setShowDev((v) => !v)}
      >
        Dev
      </button>
    </div>
  );
}

export default App;
