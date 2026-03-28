import React from 'react';

const GameDetails: React.FC<{ id: string; onToast?: (msg: string) => void }>
= ({ id }) => (
  <div className="kpi kpi--muted">Detalles de partida {id} (placeholder)</div>
);

export default GameDetails;
