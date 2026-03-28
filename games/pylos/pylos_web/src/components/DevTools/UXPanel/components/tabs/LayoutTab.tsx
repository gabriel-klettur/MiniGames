import { useI18n } from '../../../../../i18n';

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
  const { t } = useI18n();
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
        <h4 style={{ margin: '4px 0' }}>{t.uxPanel.boardAndGeometry}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label className="label">{t.uxPanel.globalScale}</label>
          <input type="number" min={0.3} max={2} step={0.05} value={scale} onChange={(e) => onChangeScale(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.boardRelativeWidth}</label>
          <input type="number" min={0.5} max={1.25} step={0.01} value={boardWidthFactor} onChange={(e) => onChangeBoardWidthFactor(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.artOffsetX}</label>
          <input type="number" step={1} value={boardOffsetX} onChange={(e) => onChangeBoardOffsetX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.artOffsetYBase}</label>
          <input type="number" step={1} value={boardOffsetYBase} onChange={(e) => onChangeBoardOffsetYBase(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.gridExtraOffsetX}</label>
          <input type="number" step={1} value={gridOffsetExtraX} onChange={(e) => onChangeGridOffsetExtraX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.gridExtraOffsetY}</label>
          <input type="number" step={1} value={gridOffsetExtraY} onChange={(e) => onChangeGridOffsetExtraY(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.cellGapBase}</label>
          <input type="number" min={0} max={40} step={1} value={levelGapBase} onChange={(e) => onChangeLevelGapBase(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.cellMinSize}</label>
          <input type="number" min={16} max={200} step={1} value={cellSizeMin} onChange={(e) => onChangeCellSizeMin(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.cellSizeMultiplier}</label>
          <input type="number" min={0.5} max={2} step={0.05} value={cellSizeMult} onChange={(e) => onChangeCellSizeMult(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.overlayNudgeX}</label>
          <input type="number" min={-100} max={100} step={1} value={overlayNudgeX} onChange={(e) => onChangeOverlayNudgeX(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.topSeparation}</label>
          <input type="number" min={-200} max={200} step={1} value={boardTopGap} onChange={(e) => onChangeBoardTopGap(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">{t.uxPanel.actionsGap}</label>
          <input type="number" min={-200} max={200} step={1} value={boardActionsGap} onChange={(e) => onChangeBoardActionsGap(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />
        </div>
      </div>
    </div>
  );
}
