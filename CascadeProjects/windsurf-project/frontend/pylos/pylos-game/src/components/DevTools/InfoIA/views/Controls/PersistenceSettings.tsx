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
      <label
        className="label"
        htmlFor="infoia-noprog"
        title={
          'Detiene la simulación si pasan N plies sin progreso (p. ej., sin recuperar piezas).\n' +
          'Ejemplo: 40 corta partidas estancadas tras ~20 jugadas por bando.'
        }
      >
        Sin progreso (plies)
      </label>
      <input id="infoia-noprog" className="field-num" type="number" min={10} max={400} value={noProgressLimit} onChange={(e) => onNoProgressLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-avoidstep"
        title={
          'Multiplicador [0–2] que incrementa la penalización por repetir (según historial).\n' +
          'Ejemplo: 0.5 introduce penalización suave; 1.5 la endurece más rápido.'
        }
      >
        Factor penalización
      </label>
      <input id="infoia-avoidstep" className="field-num" type="number" min={0} max={2} step={0.1} value={avoidStepFactor} onChange={(e) => onAvoidStepFactorChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-persist"
        title={
          'Guarda en disco claves con histórico de repeticiones/penalizaciones para reutilizarlas en futuras sesiones.\n' +
          'Útil cuando ejecutas lotes grandes en varias tandas.'
        }
      >
        Persistir anti-bucles
      </label>
      <input id="infoia-persist" type="checkbox" checked={persistAntiLoopsEnabled} onChange={(e) => onPersistAntiLoopsEnabledChange(e.target.checked)} aria-checked={persistAntiLoopsEnabled} />

      <label
        className="label"
        htmlFor="infoia-halflife"
        title={
          'Semivida del decaimiento (en días) para la información persistida.\n' +
          'Valores más altos conservan la memoria más tiempo; valores bajos la olvidan antes.'
        }
      >
        Semivida (días)
      </label>
      <input id="infoia-halflife" className="field-num" type="number" min={1} max={90} value={halfLifeDays} onChange={(e) => onHalfLifeDaysChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-cap"
        title={
          'Número máximo de entradas que se guardan en la base local.\n' +
          'Ejemplo: 500 equilibra memoria/espacio; 2000 para proyectos largos.'
        }
      >
        Cap persistencia
      </label>
      <input id="infoia-cap" className="field-num" type="number" min={50} max={2000} value={persistCap} onChange={(e) => onPersistCapChange(Number(e.target.value))} style={{ width: 100 }} />
    </>
  );
}
