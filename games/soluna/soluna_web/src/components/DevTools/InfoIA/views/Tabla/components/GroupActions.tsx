import React from 'react';

const GroupActions: React.FC<{ onClear?: () => void }>
= ({ onClear = () => {} }) => (
  <div className="row" style={{ gap: 6 }}>
    <button className="btn btn-secondary btn-sm" onClick={onClear} disabled>Limpiar grupo</button>
  </div>
);

export default GroupActions;
