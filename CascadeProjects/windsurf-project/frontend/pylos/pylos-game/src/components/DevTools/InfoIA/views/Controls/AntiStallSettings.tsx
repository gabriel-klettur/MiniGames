export function AntiStallSettings(props: {
  noveltyBonus: number;
  onNoveltyBonusChange: (v: number) => void;
  drawBias: number;
  onDrawBiasChange: (v: number) => void;
  timeRiskEnabled: boolean;
  onTimeRiskEnabledChange: (v: boolean) => void;
}) {
  const {
    noveltyBonus, onNoveltyBonusChange,
    drawBias, onDrawBiasChange,
    timeRiskEnabled, onTimeRiskEnabledChange,
  } = props;

  return (
    <>
      {/* Anti-estancamiento: bonus de novedad, sesgo de tablas y gestión de tiempo bajo riesgo */}
      <label className="label" htmlFor="infoia-novbonus" title="Pequeño bonus a estados no vistos para diversificar">Bonus novedad</label>
      <input id="infoia-novbonus" className="field-num" type="number" min={0} max={50} value={noveltyBonus} onChange={(e) => onNoveltyBonusChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-drawbias" title="Penalización ligera a ciclos (tablas peor que 0) para no preferirlos">Sesgo tablas</label>
      <input id="infoia-drawbias" className="field-num" type="number" min={0} max={50} value={drawBias} onChange={(e) => onDrawBiasChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-timerisk" title="Aumentar presupuesto de tiempo bajo riesgo de repetición">Tiempo sensible al riesgo</label>
      <input id="infoia-timerisk" type="checkbox" checked={timeRiskEnabled} onChange={(e) => onTimeRiskEnabledChange(e.target.checked)} aria-checked={timeRiskEnabled} />
    </>
  );
}
