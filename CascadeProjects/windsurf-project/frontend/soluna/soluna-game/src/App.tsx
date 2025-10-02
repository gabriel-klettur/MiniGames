import './style/index.css';
import IAUserPanel from './components/IAUserPanel';
import HeaderPanel from './components/HeaderPanel';
import Board from './components/Board/Board';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FasesPanel from './components/DevTools/FasesPanel';
import RulesPanel from './components/DevTools/RulesPanel';
import UIUX from './components/DevTools/UIUX';
import IAPanel from './components/IAPanel/IAPanel';
import InfoPanel from './components/InfoPanel';
import { useGame } from './game/store';
import { useLocalStorageBoolean } from './hooks/useLocalStorage';
import { useAiController } from './hooks/useAiController';

function App() {
  const { state, dispatch } = useGame();
  const [showDev, setShowDev] = useLocalStorageBoolean('soluna:dev:show', false);
  const [showFases, setShowFases] = useLocalStorageBoolean('soluna:dev:showFases', false);
  const [showRules, setShowRules] = useLocalStorageBoolean('soluna:dev:showRules', false);
  const [showUX, setShowUX] = useLocalStorageBoolean('soluna:dev:showUX', false);
  const [showIA, setShowIA] = useLocalStorageBoolean('soluna:ui:showIA', true);
  const {
    aiDepth, setAiDepth,
    aiTimeMode, setAiTimeMode,
    aiTimeSeconds, setAiTimeSeconds,
    aiAutoplay, setAiAutoplay,
    aiBusy, aiProgress, aiBusyElapsedMs,
    aiEval, aiPV, aiRootMoves, aiNodes, aiElapsed, aiNps, aiDepthReached,
    doAIMove,
  } = useAiController(state, dispatch);
  return (
    <div className="app">
      <HeaderPanel showIA={showIA} onToggleIA={() => setShowIA((v) => !v)} />
      {/* Panel de usuario IA: centrado, estilo Pylos (toggleable desde header) */}
      {showIA && (
        <IAUserPanel
          depth={aiDepth}
          onChangeDepth={setAiDepth}
          onAIMove={doAIMove}
          disabled={state.roundOver || state.gameOver}
          aiAutoplayActive={aiAutoplay}
          onToggleAiAutoplay={() => setAiAutoplay((v) => !v)}
          busy={aiBusy}
          progress={aiProgress}
          busyElapsedMs={aiBusyElapsedMs}
        />
      )}
      {/* Badges/Jugadores: panel centrado */}
      <InfoPanel />
      {/* Contenido principal: siempre centrado */}
      <div className="content">
        <Board />
      </div>
      {/* DevTools a ancho completo, fila independiente */}
      {showDev && (
        <div className="devtools-row">
          <div className="devtools-card">
            <DevToolsPanel
              showFases={showFases}
              onToggleFases={() => setShowFases((v) => !v)}
              showUX={showUX}
              onToggleUX={() => setShowUX((v) => !v)}
              onToggleRules={() => setShowRules((v) => !v)}
            />
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
                onToggleAiAutoplay={() => setAiAutoplay((v) => !v)}
                busyElapsedMs={aiBusyElapsedMs}
              />
            </section>
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
                <div className="section-title">UI/UX de fichas</div>
                <UIUX />
              </section>
            )}
          </div>
        </div>
      )}
      <button className={`dev-toggle-btn ${showDev ? 'active' : ''}`} onClick={() => setShowDev((v) => !v)}>
        Dev
      </button>
    </div>
  );
}

export default App
