import React from 'react';

interface DepthSelectProps {
  depth: number;
  onChangeDepth: (d: number) => void;
}

const DepthSelect: React.FC<DepthSelectProps> = ({ depth, onChangeDepth }) => {
  return (
    <div className="iauser-left">
      <label htmlFor="iauser-depth">Dificultad:</label>
      <select
        id="iauser-depth"
        value={depth}
        onChange={(e) => onChangeDepth(Number(e.target.value))}
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
};

export default DepthSelect;
