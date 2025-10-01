 

export interface AnimTabProps {
  appearMs: number;
  flashMs: number;
  flyMs: number;
  autoFillDelayMs: number;
  onChangeAppearMs: (v: number) => void;
  onChangeFlashMs: (v: number) => void;
  onChangeFlyMs: (v: number) => void;
  onChangeAutoFillDelayMs: (v: number) => void;
}

export default function AnimTab(props: AnimTabProps) {
  const { appearMs, flashMs, flyMs, autoFillDelayMs, onChangeAppearMs, onChangeFlashMs, onChangeFlyMs, onChangeAutoFillDelayMs } = props;
  return (
    <div role="tabpanel" id="panel-anim" aria-labelledby="tab-anim" className="tabs__panel">
      <div className="row">
        <h4 style={{ margin: '4px 0' }}>Velocidad de animaciones (ms)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label className="label">Aparición pieza</label>
          <input type="number" min={50} max={4000} step={10} value={Number.isFinite(appearMs) ? appearMs : 280} onChange={(e) => onChangeAppearMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} aria-label="Duración aparición pieza (ms)" />

          <label className="label">Flash celda</label>
          <input type="number" min={50} max={5000} step={10} value={Number.isFinite(flashMs) ? flashMs : 900} onChange={(e) => onChangeFlashMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} aria-label="Duración flash celda (ms)" />

          <label className="label">Vuelo pieza</label>
          <input type="number" min={50} max={6000} step={10} value={Number.isFinite(flyMs) ? flyMs : 1500} onChange={(e) => onChangeFlyMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} aria-label="Duración vuelo pieza (ms)" />

          <label className="label">Pausa auto-colocación final</label>
          <input type="number" min={0} max={5000} step={10} value={Number.isFinite(autoFillDelayMs) ? autoFillDelayMs : 250} onChange={(e) => onChangeAutoFillDelayMs(parseInt(e.target.value, 10) || 0)} style={{ width: 100 }} aria-label="Pausa entre auto-colocaciones (ms)" title="Retraso entre pasos de autocolocación cuando un jugador se queda sin bolas" />
        </div>
      </div>
    </div>
  );
}
