export function HeuristicSettings(props: {
  diversify: 'off' | 'epsilon' | 'adaptive';
  onDiversifyChange: (v: 'off' | 'epsilon' | 'adaptive') => void;
  epsilon: number;
  onEpsilonChange: (v: number) => void;
  tieDelta: number;
  onTieDeltaChange: (v: number) => void;
  workers: 'auto' | number;
  onWorkersChange: (v: 'auto' | number) => void;
  // From Anti-stall (moved here): root-level move ordering/reductions
  rootTopK: number;
  onRootTopKChange: (v: number) => void;
  rootJitter: boolean;
  onRootJitterChange: (v: boolean) => void;
  rootJitterProb: number;
  onRootJitterProbChange: (v: number) => void;
  rootLMR: boolean;
  onRootLMRChange: (v: boolean) => void;
}) {
  const {
    diversify, onDiversifyChange,
    epsilon, onEpsilonChange,
    tieDelta, onTieDeltaChange,
    workers, onWorkersChange,
    rootTopK, onRootTopKChange,
    rootJitter, onRootJitterChange,
    rootJitterProb, onRootJitterProbChange,
    rootLMR, onRootLMRChange,
  } = props;

  return (
    <>
      <label
        className="label"
        htmlFor="infoia-topk"
        title={
          'Número de mejores jugadas consideradas en la raíz.\n' +
          'Top‑K=1 => totalmente determinista (toma siempre la mejor).\n' +
          'Top‑K>1 => permite variación junto con epsilon/tie‑Δ.\n' +
          'Ejemplo: Top‑K=3 con epsilon=0.1 puede explorar la 2ª/3ª mejor ocasionalmente.'
        }
      >
        Top-K
      </label>
      <input id="infoia-topk" className="field-num" type="number" min={1} max={8} value={rootTopK} onChange={(e) => onRootTopKChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-jitter"
        title={
          'Pequeña aleatoriedad en el orden de evaluación en la raíz.\n' +
          'Útil para desatascar posiciones repetitivas.\n' +
          'Ejemplo: con jitter activo y prob=0.1, se intercambian vecinos el 10% de las veces.'
        }
      >
        Jitter raíz
      </label>
      <input id="infoia-jitter" type="checkbox" checked={rootJitter} onChange={(e) => onRootJitterChange(e.target.checked)} aria-checked={rootJitter} />

      <label
        className="label"
        htmlFor="infoia-jprob"
        title={
          'Probabilidad [0–1] de aplicar un intercambio de vecinos en el orden de jugadas en la raíz.\n' +
          'Valores pequeños (0.05–0.15) suelen bastar.'
        }
      >
        Prob. jitter
      </label>
      <input id="infoia-jprob" className="field-num" type="number" min={0} max={1} step={0.01} value={rootJitterProb} onChange={(e) => onRootJitterProbChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-lmr"
        title={
          'Late Move Reductions: reduce la profundidad de búsqueda para jugadas menos prometedoras.\n' +
          'Acelera, con pequeño riesgo de perder táctica fina.\n' +
          'Recomendado activado para lotes grandes.'
        }
      >
        LMR raíz
      </label>
      <input id="infoia-lmr" type="checkbox" checked={rootLMR} onChange={(e) => onRootLMRChange(e.target.checked)} aria-checked={rootLMR} />

      <label
        className="label"
        htmlFor="infoia-divmode"
        title={
          'Cómo variar la elección en la raíz.\n' +
          'off: determinista. epsilon: prob. fija de explorar. adaptive: sube la exploración si detecta repetición.'
        }
      >
        Diversificación
      </label>
      <select id="infoia-divmode" className="field-select" value={diversify} onChange={(e) => onDiversifyChange(e.target.value as any)}>
        <option value="off">off</option>
        <option value="epsilon">epsilon</option>
        <option value="adaptive">adaptive</option>
      </select>

      <label
        className="label"
        htmlFor="infoia-eps"
        title={
          'Probabilidad [0–1] de no elegir la mejor jugada dentro de Top‑K cuando la diversificación es "epsilon".\n' +
          'Ejemplo: epsilon=0.10 => 10% de las veces prueba otra dentro de Top‑K.'
        }
      >
        Epsilon
      </label>
      <input id="infoia-eps" className="field-num" type="number" min={0} max={1} step={0.01} value={epsilon} onChange={(e) => onEpsilonChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-tied"
        title={
          'Ventana de empate en la raíz: jugadas con evaluación a ≤ Tie‑Δ se consideran casi equivalentes y elegibles para muestreo.\n' +
          'Ejemplo: Tie‑Δ=20 favorece variedad cuando las mejores están muy parejas.'
        }
      >
        Tie Δ
      </label>
      <input id="infoia-tied" className="field-num" type="number" min={0} max={100} value={tieDelta} onChange={(e) => onTieDeltaChange(Number(e.target.value))} style={{ width: 90 }} />

      <label
        className="label"
        htmlFor="infoia-workers"
        title={
          'Cantidad de hilos de búsqueda. "auto" usa un valor razonable según tu CPU.\n' +
          'Fijar un número puede ayudar a comparar runs en máquinas distintas.'
        }
      >
        Workers
      </label>
      <select id="infoia-workers" className="field-select" value={String(workers)} onChange={(e) => {
        const v = e.target.value;
        if (v === 'auto') onWorkersChange('auto'); else {
          const n = Math.max(1, Math.min(16, Math.floor(Number(v))));
          onWorkersChange(n);
        }
      }}>
        <option value="auto">auto</option>
        {Array.from({ length: 16 }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </>
  );
}
