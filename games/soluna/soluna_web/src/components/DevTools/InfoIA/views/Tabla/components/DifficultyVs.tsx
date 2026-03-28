import React from 'react';

const DifficultyVs: React.FC<{ p1Depth: number; p2Depth: number }> = ({ p1Depth, p2Depth }) => (
  <span className="kpi">Dificultad {p1Depth} vs {p2Depth}</span>
);

export default DifficultyVs;
