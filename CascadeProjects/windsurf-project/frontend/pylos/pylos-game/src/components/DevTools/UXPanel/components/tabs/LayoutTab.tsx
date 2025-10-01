 

export interface LayoutTabProps {
  scale: number;
  onChangeScale: (v: number) => void;
  boardWidthFactor: number;
  onChangeBoardWidthFactor: (v: number) => void;
  boardOffsetX: number;
  onChangeBoardOffsetX: (v: number) => void;
  boardOffsetYBase: number;
  onChangeBoardOffsetYBase: (v: number) => void;
  gridOffsetExtraX: number;
  onChangeGridOffsetExtraX: (v: number) => void;
  gridOffsetExtraY: number;
  onChangeGridOffsetExtraY: (v: number) => void;
  levelGapBase: number;
  onChangeLevelGapBase: (v: number) => void;
  cellSizeMin: number;
  onChangeCellSizeMin: (v: number) => void;
  cellSizeMult: number;
  onChangeCellSizeMult: (v: number) => void;
  overlayNudgeX: number;
  onChangeOverlayNudgeX: (v: number) => void;
  boardTopGap: number;
  onChangeBoardTopGap: (v: number) => void;
  boardActionsGap: number;
  onChangeBoardActionsGap: (v: number) => void;
}

export default function LayoutTab(props: LayoutTabProps) {
  const {
    scale, onChangeScale,
    boardWidthFactor, onChangeBoardWidthFactor,
    boardOffsetX, onChangeBoardOffsetX,
    boardOffsetYBase, onChangeBoardOffsetYBase,
    gridOffsetExtraX, onChangeGridOffsetExtraX,
    gridOffsetExtraY, onChangeGridOffsetExtraY,
    levelGapBase, onChangeLevelGapBase,
    cellSizeMin, onChangeCellSizeMin,
    cellSizeMult, onChangeCellSizeMult,
    overlayNudgeX, onChangeOverlayNudgeX,
    boardTopGap, onChangeBoardTopGap,
    boardActionsGap, onChangeBoardActionsGap,
  } = props;

  return (
    <div role="tabpanel" id="panel-layout" aria-labelledby="tab-layout" className="tabs__panel">
      <div className="row">
        <h4 style={{ margin: '4px 0' }}>Tablero y geometría</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label className="label">Escala global</label>
          <input type="number" min={0.3} max={2} step={0.05} value={scale} onChange={(e) => onChangeScale(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Ancho relativo tablero</label>
          <input type="number" min={0.5} max={1.25} step={0.01} value={boardWidthFactor} onChange={(e) => onChangeBoardWidthFactor(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Offset arte X (px)</label>
          <input type="number" step={1} value={boardOffsetX} onChange={(e) => onChangeBoardOffsetX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Offset arte Y base (px)</label>
          <input type="number" step={1} value={boardOffsetYBase} onChange={(e) => onChangeBoardOffsetYBase(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Offset extra grid X (px)</label>
          <input type="number" step={1} value={gridOffsetExtraX} onChange={(e) => onChangeGridOffsetExtraX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Offset extra grid Y (px)</label>
          <input type="number" step={1} value={gridOffsetExtraY} onChange={(e) => onChangeGridOffsetExtraY(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Gap base entre celdas (px)</label>
          <input type="number" min={0} max={40} step={1} value={levelGapBase} onChange={(e) => onChangeLevelGapBase(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Tamaño mínimo celda (px)</label>
          <input type="number" min={16} max={200} step={1} value={cellSizeMin} onChange={(e) => onChangeCellSizeMin(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Multiplicador cell-size</label>
          <input type="number" min={0.5} max={2} step={0.05} value={cellSizeMult} onChange={(e) => onChangeCellSizeMult(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Nudge overlays X (px)</label>
          <input type="number" min={-100} max={100} step={1} value={overlayNudgeX} onChange={(e) => onChangeOverlayNudgeX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Separación superior (px)</label>
          <input type="number" min={-200} max={200} step={1} value={boardTopGap} onChange={(e) => onChangeBoardTopGap(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Gap acciones (px)</label>
          <input type="number" min={-200} max={200} step={1} value={boardActionsGap} onChange={(e) => onChangeBoardActionsGap(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />
        </div>
      </div>
    </div>
  );
}
