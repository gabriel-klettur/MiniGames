import './App.css';
import { useEffect, useState } from 'react';
import HeaderPanel from './components/HeaderPanel';
import Board from './components/Board';
import FootPanel from './components/FootPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FasesPanel from './components/DevTools/FasesPanel';
import RulesPanel from './components/DevTools/RulesPanel';
import UIUX from './components/DevTools/UIUX';

function App() {
  const [showDev, setShowDev] = useState(true);
  const [showFases, setShowFases] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showUX, setShowUX] = useState(false);

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
  return (
    <div className="app-layout">
      <HeaderPanel />
      <main className="main-area">
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
