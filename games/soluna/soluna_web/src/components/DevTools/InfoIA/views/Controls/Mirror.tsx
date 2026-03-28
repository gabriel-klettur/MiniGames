import React from 'react';

const Mirror: React.FC<{ enabled?: boolean; onToggle?: () => void }>
= ({ enabled = true, onToggle = () => {} }) => (
  <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
    <input type="checkbox" checked={enabled} onChange={onToggle} />
    Espejar tablero (placeholder)
  </label>
);

export default Mirror;
