import { useI18n } from '../../../../../i18n';

export interface SizeTabProps {
  // Pieces
  pieceScale: number;
  onChangePieceScale: (v: number) => void;
  // Board/cells
  scale: number;
  onChangeScale: (v: number) => void;
  cellSizeMin: number;
  onChangeCellSizeMin: (v: number) => void;
  cellSizeMult: number;
  onChangeCellSizeMult: (v: number) => void;
  levelGapBase: number;
  onChangeLevelGapBase: (v: number) => void;
  // Holes
  holeScale: number;
  onChangeHoleScale: (v: number) => void;
  ballMatrixScale: number;
  onChangeBallMatrixScale: (v: number) => void;
  holeMatrixScale: number;
  onChangeHoleMatrixScale: (v: number) => void;
  holeRingW: number;
  onChangeHoleRingW: (v: number) => void;
  holeInset: number;
  onChangeHoleInset: (v: number) => void;
  // Debug outline widths
  dbgGridOutlineW: number;
  onChangeDbgGridOutlineW: (v: number) => void;
  dbgCellOutlineW: number;
  onChangeDbgCellOutlineW: (v: number) => void;
  dbgDisabledOutlineW: number;
  onChangeDbgDisabledOutlineW: (v: number) => void;
  dbgClickableOutlineW: number;
  onChangeDbgClickableOutlineW: (v: number) => void;
}

export default function SizeTab(props: SizeTabProps) {
  const { t } = useI18n();
  const {
    pieceScale, onChangePieceScale,
    scale, onChangeScale,
    cellSizeMin, onChangeCellSizeMin,
    cellSizeMult, onChangeCellSizeMult,
    levelGapBase, onChangeLevelGapBase,
    holeScale, onChangeHoleScale,
    ballMatrixScale, onChangeBallMatrixScale,
    holeMatrixScale, onChangeHoleMatrixScale,
    holeRingW, onChangeHoleRingW,
    holeInset, onChangeHoleInset,
    dbgGridOutlineW, onChangeDbgGridOutlineW,
    dbgCellOutlineW, onChangeDbgCellOutlineW,
    dbgDisabledOutlineW, onChangeDbgDisabledOutlineW,
    dbgClickableOutlineW, onChangeDbgClickableOutlineW,
  } = props;
  return (
    <div role="tabpanel" id="panel-size" aria-labelledby="tab-size" className="tabs__panel">
      {/* Pieces */}
      <div className="row">
        <label className="label">{t.uxPanel.balls}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.pieceScale}
            <input type="number" min={0.8} max={2.5} step={0.05} value={Number.isFinite(pieceScale) ? pieceScale : 1}
                   onChange={(e) => onChangePieceScale(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        </div>
      </div>

      {/* Board & Cells */}
      <div className="row">
        <label className="label">{t.uxPanel.boardAndCells}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.boardScale}
            <input type="number" min={0.3} max={2.0} step={0.05} value={scale}
                   onChange={(e) => onChangeScale(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.cellSizeMin}
            <input type="number" min={16} max={200} step={1} value={cellSizeMin}
                   onChange={(e) => onChangeCellSizeMin(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.cellSizeMult}
            <input type="number" min={0.5} max={2} step={0.05} value={cellSizeMult}
                   onChange={(e) => onChangeCellSizeMult(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.levelGapBasePx}
            <input type="number" min={0} max={40} step={1} value={levelGapBase}
                   onChange={(e) => onChangeLevelGapBase(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        </div>
      </div>

      {/* Holes */}
      <div className="row">
        <label className="label">{t.uxPanel.holes}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.holeScale}
            <input type="number" min={0.6} max={1.6} step={0.05} value={holeScale}
                   onChange={(e) => onChangeHoleScale(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.ballMatrixScale}
            <input type="number" min={0.6} max={1.6} step={0.05} value={ballMatrixScale}
                   onChange={(e) => onChangeBallMatrixScale(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.holeMatrixScale}
            <input type="number" min={0.6} max={1.6} step={0.05} value={holeMatrixScale}
                   onChange={(e) => onChangeHoleMatrixScale(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.ringWidthPx}
            <input type="number" min={0} max={10} step={1} value={holeRingW}
                   onChange={(e) => onChangeHoleRingW(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.insetPx}
            <input type="number" min={0} max={12} step={1} value={holeInset}
                   onChange={(e) => onChangeHoleInset(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        </div>
      </div>

      {/* Debug hitboxes thickness */}
      <div className="row">
        <label className="label">{t.uxPanel.hitboxesDebug}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.gridPx}
            <input type="number" min={0} max={12} step={1} value={dbgGridOutlineW}
                   onChange={(e) => onChangeDbgGridOutlineW(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.cellOutlinePx}
            <input type="number" min={0} max={12} step={1} value={dbgCellOutlineW}
                   onChange={(e) => onChangeDbgCellOutlineW(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.disabledPx}
            <input type="number" min={0} max={12} step={1} value={dbgDisabledOutlineW}
                   onChange={(e) => onChangeDbgDisabledOutlineW(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.uxPanel.clickablePinkPx}
            <input type="number" min={0} max={12} step={1} value={dbgClickableOutlineW}
                   onChange={(e) => onChangeDbgClickableOutlineW(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        </div>
      </div>
    </div>
  );
}
