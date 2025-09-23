import './App.css';
import { useEffect, useRef, useState } from 'react';
import HeaderPanel from './components/HeaderPanel';
import Board from './components/Board';
import FootPanel from './components/FootPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FasesPanel from './components/DevTools/FasesPanel';
import RulesPanel from './components/DevTools/RulesPanel';
import UIUX from './components/DevTools/UIUX';
import IAUserPanel from './ia/IAUserPanel';
import IAPanel from './ia/IAPanel';
import { bestMove, type AIMove } from './ia';
import { useGame } from './game/store';

function App() {
  const { state, dispatch } = useGame();
  const [showDev, setShowDev] = useState(true);
  const [showFases, setShowFases] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showUX, setShowUX] = useState(false);

  // IA settings and metrics
  const [aiDepth, setAiDepth] = useState(2);
  const [aiTimeMode, setAiTimeMode] = useState<'auto' | 'manual'>('auto');
  const [aiTimeSeconds, setAiTimeSeconds] = useState(3);
  const [aiAutoplay, setAiAutoplay] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiEval, setAiEval] = useState<number | null>(null);
  const [aiPV, setAiPV] = useState<AIMove[]>([]);
  const [aiRootMoves, setAiRootMoves] = useState<Array<{ move: AIMove; score: number }>>([]);
  const [aiNodes, setAiNodes] = useState(0);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiNps, setAiNps] = useState(0);
  const [aiDepthReached, setAiDepthReached] = useState<number | null>(null);
  const [aiProgress, setAiProgress] = useState<{ depth: number; score: number } | null>(null);
  const [aiBusyElapsedMs, setAiBusyElapsedMs] = useState(0);

  // Worker for AI
  const workerRef = useRef<Worker | null>(null);
  const searchIdRef = useRef(0);

  useEffect(() => {
    // Create worker (Vite-compatible URL)
    try {
      workerRef.current = new Worker(new URL('./ia/worker/aiWorker.ts', import.meta.url), { type: 'module' });
      const w = workerRef.current;
      w.onmessage = (e: MessageEvent) => {
        const data = e.data || {};
        if (typeof data.searchId === 'number' && data.searchId !== searchIdRef.current) {
          // Stale message, ignore
          return;
        }
        if (data.type === 'PROGRESS') {
          setAiProgress({ depth: data.depth ?? 0, score: data.score ?? 0 });
          if (typeof data.nodes === 'number') setAiNodes(data.nodes);
        } else if (data.type === 'RESULT') {
          setAiEval(data.score ?? null);
          setAiDepthReached(data.depthReached ?? null);
          setAiPV(data.pv ?? []);
          setAiRootMoves(data.rootMoves ?? []);
          setAiNodes(data.nodes ?? 0);
          setAiElapsed(data.elapsedMs ?? 0);
          setAiNps(data.nps ?? 0);
          setAiProgress(null);
          setAiBusy(false);
          if (typeof data.elapsedMs === 'number') setAiBusyElapsedMs(data.elapsedMs);
          const mv = data.bestMove as any;
          if (mv && mv.sourceId && mv.targetId && !state.roundOver && !state.gameOver) {
            // Ejecutar la mejor jugada encontrada
            dispatch({ type: 'select', id: mv.sourceId });
            dispatch({ type: 'attempt-merge', targetId: mv.targetId });
          }
        }
      };
    } catch (err) {
      console.warn('AI Worker no disponible, se usará búsqueda en el hilo principal.', err);
    }
    return () => {
      try {
        workerRef.current?.postMessage({ type: 'CANCEL' });
        workerRef.current?.terminate();
      } catch {}
      workerRef.current = null;
    };
  }, [dispatch, state.gameOver, state.roundOver]);

  // persist Dev toggle between reloads (optional nice-to-have)
  useEffect(() => {
    try {
      const v = window.localStorage.getItem('soluna:dev:show');
      if (v != null) setShowDev(v === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem('soluna:dev:show', showDev ? '1' : '0'); } catch {}
  }, [showDev]);

  async function doAIMove() {
    if (aiBusy) return;
    if (state.roundOver || state.gameOver) return;
    setAiBusy(true);
    setAiProgress(null);
    setAiDepthReached(null);
    setAiBusyElapsedMs(0);
    searchIdRef.current += 1;
    const searchId = searchIdRef.current;
    // Prefer worker if available
    const w = workerRef.current;
    if (w) {
      try {
        // Cancel any ongoing search first
        w.postMessage({ type: 'CANCEL' });
      } catch {}
      // Small timeout to ensure cancel is processed
      setTimeout(() => {
        try {
          w.postMessage({
            type: 'SEARCH',
            state,
            depth: aiDepth,
            timeMs: aiTimeMode === 'manual' ? Math.max(50, Math.floor(aiTimeSeconds * 1000)) : undefined,
            searchId,
          });
        } catch (err) {
          console.warn('PostMessage to AI worker failed, fallback to main-thread search.', err);
          // Fallback to main thread
          const res = bestMove(state, aiDepth);
          setAiEval(res.score ?? null);
          setAiPV(res.pv ?? []);
          setAiRootMoves(res.rootMoves ?? []);
          setAiNodes(res.nodes ?? 0);
          setAiElapsed(res.elapsedMs ?? 0);
          setAiNps(res.nps ?? 0);
          setAiDepthReached(null);
          setAiBusy(false);
          setAiBusyElapsedMs(res.elapsedMs ?? 0);
          if (res.move) {
            dispatch({ type: 'select', id: (res.move as any).sourceId });
            dispatch({ type: 'attempt-merge', targetId: (res.move as any).targetId });
          }
        }
      }, 0);
      return;
    }
    // Fallback path (no worker)
    const res = bestMove(state, aiDepth);
    setAiEval(res.score ?? null);
    setAiPV(res.pv ?? []);
    setAiRootMoves(res.rootMoves ?? []);
    setAiNodes(res.nodes ?? 0);
    setAiElapsed(res.elapsedMs ?? 0);
    setAiNps(res.nps ?? 0);
    setAiDepthReached(null);
    setAiBusy(false);
    setAiBusyElapsedMs(res.elapsedMs ?? 0);
    if (res.move) {
      dispatch({ type: 'select', id: (res.move as any).sourceId });
      dispatch({ type: 'attempt-merge', targetId: (res.move as any).targetId });
    }
  }

  // Autoplay: mover automáticamente cuando está activo y es turno de alguien
  useEffect(() => {
    if (!aiAutoplay) return;
    if (aiBusy) return;
    if (state.roundOver || state.gameOver) return;
    // Pequeño delay para permitir render
    const t = setTimeout(() => {
      doAIMove();
    }, aiTimeMode === 'manual' ? Math.max(0, Math.floor(aiTimeSeconds * 1000)) : 0);
    return () => clearTimeout(t);
  }, [aiAutoplay, state.currentPlayer, state.roundOver, state.gameOver, aiBusy, aiTimeMode, aiTimeSeconds]);

  // Live timer while busy
  useEffect(() => {
    if (!aiBusy) return;
    const start = performance.now();
    setAiBusyElapsedMs(0);
    const id = setInterval(() => {
      setAiBusyElapsedMs(performance.now() - start);
    }, 120);
    return () => clearInterval(id);
  }, [aiBusy]);
  return (
    <div className="app-layout">
      <HeaderPanel />
      <main className="main-area">
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
        <Board />
        {showDev && (
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
        )}
      </main>
      <button className={`dev-toggle-btn ${showDev ? 'active' : ''}`} onClick={() => setShowDev((v) => !v)}>
        Dev
      </button>
      <FootPanel />
    </div>
  );
}

export default App
