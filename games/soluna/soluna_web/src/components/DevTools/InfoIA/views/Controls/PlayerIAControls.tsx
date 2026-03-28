import React from 'react';

const PlayerIAControls: React.FC<{ p1: boolean; p2: boolean; onToggleP1: () => void; onToggleP2: () => void }>
= ({ p1, p2, onToggleP1, onToggleP2 }) => (
  <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input type="checkbox" checked={p1} onChange={onToggleP1} /> IA controla Jugador 1
    </label>
    <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input type="checkbox" checked={p2} onChange={onToggleP2} /> IA controla Jugador 2
    </label>
  </div>
);

export default PlayerIAControls;
