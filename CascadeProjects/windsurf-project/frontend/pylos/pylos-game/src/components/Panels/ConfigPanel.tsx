import React from 'react';

export interface ConfigPanelProps {
  cellSize: number;
  gapSize: number;
  gridX?: number;      // px translation for grid
  gridY?: number;      // px translation for grid
  gridGapX?: number;   // horizontal spacing override for grid
  gridGapY?: number;   // vertical spacing override for grid
  holeSize?: number;   // diameter of the hole visualization in px
  ballSize?: number;   // diameter of the marble image in px
  onChangeCell: (v: number) => void;
  onChangeGap: (v: number) => void;
  onChangeGridX?: (v: number) => void;
  onChangeGridY?: (v: number) => void;
  onChangeGridGapX?: (v: number) => void;
  onChangeGridGapY?: (v: number) => void;
  onChangeHole?: (v: number) => void;
  onChangeBall?: (v: number) => void;
  onReset: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ cellSize, gapSize, gridX = 0, gridY = 0, gridGapX = gapSize, gridGapY = gapSize, holeSize = Math.round(cellSize * 0.82), ballSize = Math.round(cellSize * 0.9), onChangeCell, onChangeGap, onChangeGridX, onChangeGridY, onChangeGridGapX, onChangeGridGapY, onChangeHole, onChangeBall, onReset }) => {
  return (
    <div className="config-panel">
      <div className="row">
        <label>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              title="Tablero"
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                background: '#fbbf24',
                border: '2px solid #1f2937',
                borderRadius: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            />
            Tamaño celda: {cellSize}px
          </span>
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              title="Hueco"
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                background: 'rgba(236, 72, 153, 0.28)',
                border: '2px solid rgba(190, 24, 93, 0.8)',
                borderRadius: 2,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }}
            />
            Tamaño hueco: {holeSize}px
          </span>
          <input
            type="range"
            min={8}
            max={160}
            step={1}
            value={holeSize}
            onChange={(e) => onChangeHole?.(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Tamaño bola: {ballSize}px
          <input
            type="range"
            min={8}
            max={160}
            step={1}
            value={ballSize}
            onChange={(e) => onChangeBall?.(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Separación: {gapSize}px
          <input
            type="range"
            min={-24}
            max={24}
            step={1}
            value={gapSize}
            onChange={(e) => onChangeGap(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Grid gap X: {gridGapX}px
          <input
            type="range"
            min={-24}
            max={24}
            step={1}
            value={gridGapX}
            onChange={(e) => onChangeGridGapX?.(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Grid gap Y: {gridGapY}px
          <input
            type="range"
            min={-24}
            max={24}
            step={1}
            value={gridGapY}
            onChange={(e) => onChangeGridGapY?.(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Grid X: {gridX}px
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={gridX}
            onChange={(e) => onChangeGridX?.(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="row">
        <label>
          Grid Y: {gridY}px
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={gridY}
            onChange={(e) => onChangeGridY?.(Number(e.target.value))}
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
