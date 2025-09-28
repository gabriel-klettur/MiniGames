export function PersistenceSettings(props: {
  noProgressLimit: number;
  onNoProgressLimitChange: (v: number) => void;
  avoidStepFactor: number;
  onAvoidStepFactorChange: (v: number) => void;
  persistAntiLoopsEnabled: boolean;
  onPersistAntiLoopsEnabledChange: (v: boolean) => void;
  halfLifeDays: number;
  onHalfLifeDaysChange: (v: number) => void;
  persistCap: number;
  onPersistCapChange: (v: number) => void;
}) {
  const {
    noProgressLimit, onNoProgressLimitChange,
    avoidStepFactor, onAvoidStepFactorChange,
    persistAntiLoopsEnabled, onPersistAntiLoopsEnabledChange,
    halfLifeDays, onHalfLifeDaysChange,
    persistCap, onPersistCapChange,
  } = props;

  return (
    <>
      <label className="label" htmlFor="infoia-noprog" title="Cortar simulación si no hay progreso en N plies">Sin progreso (plies)</label>
      <input id="infoia-noprog" className="field-num" type="number" min={10} max={400} value={noProgressLimit} onChange={(e) => onNoProgressLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-avoidstep" title="Factor de incremento de penalización ponderada (0..2)">Factor penalización</label>
      <input id="infoia-avoidstep" className="field-num" type="number" min={0} max={2} step={0.1} value={avoidStepFactor} onChange={(e) => onAvoidStepFactorChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-persist" title="Persistir claves de anti-bucle entre sesiones">Persistir anti-bucles</label>
      <input id="infoia-persist" type="checkbox" checked={persistAntiLoopsEnabled} onChange={(e) => onPersistAntiLoopsEnabledChange(e.target.checked)} aria-checked={persistAntiLoopsEnabled} />

      <label className="label" htmlFor="infoia-halflife" title="Semivida en días para decaimiento de pesos persistidos">Semivida (días)</label>
      <input id="infoia-halflife" className="field-num" type="number" min={1} max={90} value={halfLifeDays} onChange={(e) => onHalfLifeDaysChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-cap" title="Límite de entradas persistidas">Cap persistencia</label>
      <input id="infoia-cap" className="field-num" type="number" min={50} max={2000} value={persistCap} onChange={(e) => onPersistCapChange(Number(e.target.value))} style={{ width: 100 }} />
    </>
  );
}
