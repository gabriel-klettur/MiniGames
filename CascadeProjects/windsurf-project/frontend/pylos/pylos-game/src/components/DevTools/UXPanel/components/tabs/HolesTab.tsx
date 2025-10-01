 

export interface HolesTabProps {
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
}

export default function HolesTab(props: HolesTabProps) {
  const { holeScale, onChangeHoleScale, ballMatrixScale, onChangeBallMatrixScale, holeMatrixScale, onChangeHoleMatrixScale, holeRingW, onChangeHoleRingW, holeInset, onChangeHoleInset } = props;
  return (
    <div role="tabpanel" id="panel-holes" aria-labelledby="tab-holes" className="tabs__panel">
      <div className="row">
        <h4 style={{ margin: '4px 0' }}>Huecos y bolas</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label className="label">Escala hueco (slot)</label>
          <input type="number" min={0.5} max={1.6} step={0.02} value={holeScale} onChange={(e) => onChangeHoleScale(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Matriz bola (scale)</label>
          <input type="number" min={0.6} max={1.6} step={0.02} value={ballMatrixScale} onChange={(e) => onChangeBallMatrixScale(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Matriz hueco (scale)</label>
          <input type="number" min={0.6} max={1.6} step={0.02} value={holeMatrixScale} onChange={(e) => onChangeHoleMatrixScale(parseFloat(e.target.value))} style={{ width: 100 }} />

          <label className="label">Ancho aro (px)</label>
          <input type="number" min={0} max={10} step={1} value={holeRingW} onChange={(e) => onChangeHoleRingW(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />

          <label className="label">Inset hueco (px)</label>
          <input type="number" min={0} max={12} step={1} value={holeInset} onChange={(e) => onChangeHoleInset(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} />
        </div>
      </div>
    </div>
  );
}
