import React from 'react';

const WinnerIcon: React.FC<{ winner: 0 | 1 | 2 }> = ({ winner }) => {
  if (winner === 1) return <span title="Ganó J1">🏆 J1</span>;
  if (winner === 2) return <span title="Ganó J2">🏆 J2</span>;
  return <span title="Empate">—</span>;
};

export default WinnerIcon;
