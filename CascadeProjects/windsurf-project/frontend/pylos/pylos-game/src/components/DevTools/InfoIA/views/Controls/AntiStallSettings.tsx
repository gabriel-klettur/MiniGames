export function AntiStallSettings(props: {
  noveltyBonus: number;
  onNoveltyBonusChange: (v: number) => void;
  rootTopK: number;
  onRootTopKChange: (v: number) => void;
  rootJitter: boolean;
  onRootJitterChange: (v: boolean) => void;
  rootJitterProb: number;
  onRootJitterProbChange: (v: number) => void;
  rootLMR: boolean;
  onRootLMRChange: (v: boolean) => void;
  drawBias: number;
  onDrawBiasChange: (v: number) => void;
  timeRiskEnabled: boolean;
  onTimeRiskEnabledChange: (v: boolean) => void;
}) {
  const {
    noveltyBonus, onNoveltyBonusChange,
    rootTopK, onRootTopKChange,
    rootJitter, onRootJitterChange,
    rootJitterProb, onRootJitterProbChange,
    rootLMR, onRootLMRChange,
    drawBias, onDrawBiasChange,
    timeRiskEnabled, onTimeRiskEnabledChange,
  } = props;

  return (
    <>
      {/* Anti-estancamiento: bonus de novedad, Top-K, jitter, LMR y sesgo de tablas */}
      <label className="label" htmlFor="infoia-novbonus" title="Pequeño bonus a estados no vistos para diversificar">Bonus novedad</label>
      <input id="infoia-novbonus" className="field-num" type="number" min={0} max={50} value={noveltyBonus} onChange={(e) => onNoveltyBonusChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-topk" title="Líneas raíz candidatas para muestreo epsilon-greedy">Top-K</label>
      <input id="infoia-topk" className="field-num" type="number" min={2} max={8} value={rootTopK} onChange={(e) => onRootTopKChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-jitter" title="Añadir jitter seedable al orden de raíz cuando hay repetición">Jitter raíz</label>
      <input id="infoia-jitter" type="checkbox" checked={rootJitter} onChange={(e) => onRootJitterChange(e.target.checked)} aria-checked={rootJitter} />

      <label className="label" htmlFor="infoia-jprob" title="Probabilidad de intercambio vecino-vecino en el orden de raíz">Prob. jitter</label>
      <input id="infoia-jprob" className="field-num" type="number" min={0} max={1} step={0.01} value={rootJitterProb} onChange={(e) => onRootJitterProbChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-lmr" title="Reducir más la profundidad en movimientos repetitivos en la raíz">LMR raíz</label>
      <input id="infoia-lmr" type="checkbox" checked={rootLMR} onChange={(e) => onRootLMRChange(e.target.checked)} aria-checked={rootLMR} />

      <label className="label" htmlFor="infoia-drawbias" title="Penalización ligera a ciclos (tablas peor que 0) para no preferirlos">Sesgo tablas</label>
      <input id="infoia-drawbias" className="field-num" type="number" min={0} max={50} value={drawBias} onChange={(e) => onDrawBiasChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-timerisk" title="Aumentar presupuesto de tiempo bajo riesgo de repetición">Tiempo sensible al riesgo</label>
      <input id="infoia-timerisk" type="checkbox" checked={timeRiskEnabled} onChange={(e) => onTimeRiskEnabledChange(e.target.checked)} aria-checked={timeRiskEnabled} />
    </>
  );
}
