import React from 'react';

const ActionsBar: React.FC<{ onStart?: () => void; onStop?: () => void; running?: boolean }>
= ({ onStart, onStop, running }) => (
  <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    <button className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`} onClick={running ? onStop : onStart}>
      {running ? 'Detener' : 'Iniciar'}
    </button>
  </div>
);

export default ActionsBar;
