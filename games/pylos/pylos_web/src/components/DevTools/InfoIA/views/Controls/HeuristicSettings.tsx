import { useI18n } from '../../../../../i18n';

export function HeuristicSettings(props: {
  diversify: 'off' | 'epsilon' | 'adaptive';
  onDiversifyChange: (v: 'off' | 'epsilon' | 'adaptive') => void;
  epsilon: number;
  onEpsilonChange: (v: number) => void;
  tieDelta: number;
  onTieDeltaChange: (v: number) => void;
  workers: 'auto' | number;
  onWorkersChange: (v: 'auto' | number) => void;
  rootTopK: number;
  onRootTopKChange: (v: number) => void;
  rootJitter: boolean;
  onRootJitterChange: (v: boolean) => void;
  rootJitterProb: number;
  onRootJitterProbChange: (v: number) => void;
  rootLMR: boolean;
  onRootLMRChange: (v: boolean) => void;
  bitboardsEnabled?: boolean;
  onBitboardsEnabledChange?: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const {
    diversify, onDiversifyChange,
    epsilon, onEpsilonChange,
    tieDelta, onTieDeltaChange,
    workers, onWorkersChange,
    rootTopK, onRootTopKChange,
    rootJitter, onRootJitterChange,
    rootJitterProb, onRootJitterProbChange,
    rootLMR, onRootLMRChange,
    bitboardsEnabled, onBitboardsEnabledChange,
  } = props;

  return (
    <>
      <label className="label" htmlFor="infoia-bitboards" title={t.infoIA.bitboardsTitle}>{t.infoIA.bitboards}</label>
      <input id="infoia-bitboards" type="checkbox" checked={!!bitboardsEnabled} onChange={(e) => onBitboardsEnabledChange?.(e.target.checked)} aria-checked={!!bitboardsEnabled} />

      <label className="label" htmlFor="infoia-topk" title={t.infoIA.topKTitle}>{t.infoIA.topK}</label>
      <input id="infoia-topk" className="field-num" type="number" min={1} max={8} value={rootTopK} onChange={(e) => onRootTopKChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-jitter" title={t.infoIA.jitterRootTitle}>{t.infoIA.jitterRoot}</label>
      <input id="infoia-jitter" type="checkbox" checked={rootJitter} onChange={(e) => onRootJitterChange(e.target.checked)} aria-checked={rootJitter} />

      <label className="label" htmlFor="infoia-jprob" title={t.infoIA.jitterProbTitle}>{t.infoIA.jitterProb}</label>
      <input id="infoia-jprob" className="field-num" type="number" min={0} max={1} step={0.01} value={rootJitterProb} onChange={(e) => onRootJitterProbChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-lmr" title={t.infoIA.lmrRootTitle}>{t.infoIA.lmrRoot}</label>
      <input id="infoia-lmr" type="checkbox" checked={rootLMR} onChange={(e) => onRootLMRChange(e.target.checked)} aria-checked={rootLMR} />

      <label className="label" htmlFor="infoia-divmode" title={t.infoIA.diversificationTitle}>{t.infoIA.diversification}</label>
      <select id="infoia-divmode" className="field-select" value={diversify} onChange={(e) => onDiversifyChange(e.target.value as any)}>
        <option value="off">off</option>
        <option value="epsilon">epsilon</option>
        <option value="adaptive">adaptive</option>
      </select>

      <label className="label" htmlFor="infoia-eps" title={t.infoIA.epsilonTitle}>{t.infoIA.epsilon}</label>
      <input id="infoia-eps" className="field-num" type="number" min={0} max={1} step={0.01} value={epsilon} onChange={(e) => onEpsilonChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-tied" title={t.infoIA.tieDeltaTitle}>{t.infoIA.tieDelta}</label>
      <input id="infoia-tied" className="field-num" type="number" min={0} max={100} value={tieDelta} onChange={(e) => onTieDeltaChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-workers" title={t.infoIA.workersTitle}>{t.infoIA.workers}</label>
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
