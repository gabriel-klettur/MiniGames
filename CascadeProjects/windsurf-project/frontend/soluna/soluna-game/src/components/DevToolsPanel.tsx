import { useEffect, useState } from 'react';
import { useGame } from '../game/store';

export default function DevToolsPanel() {
  const { state, dispatch } = useGame();
  const [showStacks, setShowStacks] = useState(false);
  const [zoom, setZoom] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('soluna:zoom') : null;
    return v ? parseFloat(v) : 1;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--board-zoom', String(zoom));
    try {
      window.localStorage.setItem('soluna:zoom', String(zoom));
    } catch {}
  }, [zoom]);

  return (
    <aside className="devtools-panel">
      <div className="devtools-header">DevTools</div>
      <div className="devtools-actions">
        <button onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
        <button onClick={() => dispatch({ type: 'reset-game' })}>Reset juego</button>
        <label className="toggle">
          <input type="checkbox" checked={showStacks} onChange={(e) => setShowStacks(e.target.checked)} />
          Mostrar datos
        </label>
      </div>
      <div className="devtools-zoom" style={{ display: 'grid', gap: '0.35rem' }}>
        <div><strong>Zoom tablero</strong> ({Math.round(zoom * 100)}%)</div>
        <input
          type="range"
          min={0.8}
          max={1.6}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}>-</button>
          <button onClick={() => setZoom(1)}>100%</button>
          <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}>+</button>
        </div>
      </div>
      {showStacks && (
        <pre className="devtools-pre">{JSON.stringify(state, null, 2)}</pre>
      )}
    </aside>
  );
}

