import React from 'react';

export interface ConfigPanelProps {
  cellSize: number;
  gapSize: number;
  onChangeCell: (v: number) => void;
  onChangeGap: (v: number) => void;
  onReset: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ cellSize, gapSize, onChangeCell, onChangeGap, onReset }) => {
  return (
    <div className="config-panel">
      <div className="row">
        <label>
          Tamaño celda: {cellSize}px
          <input
            type="range"
            min={36}
            max={96}
            step={2}
            value={cellSize}
            onChange={(e) => onChangeCell(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Separación: {gapSize}px
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={gapSize}
            onChange={(e) => onChangeGap(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <button onClick={onReset}>Restablecer</button>
      </div>
    </div>
  );
};

export default React.memo(ConfigPanel);
