import { useEffect, useMemo, useState } from 'react';
import type { AIAdvancedConfig } from '../../types';
import { readAdvancedCfg, writeAdvancedCfg } from '../../../../../utils/iaAdvancedStorage.ts';

type AntiStallSettingsProps = {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (cfg: Partial<AIAdvancedConfig>) => void;
};

export default function AntiStallSettings(props: AntiStallSettingsProps) {
  const init = useMemo(() => readAdvancedCfg(), []);
  const [noveltyBonus, setNoveltyBonus] = useState<number>(init.noveltyBonus ?? 5);
  const [rootTopK, setRootTopK] = useState<number>(init.rootTopK ?? 3);
  const [rootJitter, setRootJitter] = useState<boolean>(init.rootJitter ?? true);
  const [rootJitterProb, setRootJitterProb] = useState<number>(init.rootJitterProb ?? 0.1);
  const [rootLMR, setRootLMR] = useState<boolean>(init.rootLMR ?? true);
  const [drawBias, setDrawBias] = useState<number>(init.drawBias ?? 5);

  useEffect(() => {
    writeAdvancedCfg({ noveltyBonus });
    props.onChangeIaConfig({ noveltyBonus });
  }, [noveltyBonus]);
  useEffect(() => {
    const v = Math.max(2, Math.min(8, Math.floor(rootTopK)));
    setRootTopK(v);
    writeAdvancedCfg({ rootTopK: v });
    props.onChangeIaConfig({ rootTopK: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootTopK]);
  useEffect(() => {
    writeAdvancedCfg({ rootJitter });
    props.onChangeIaConfig({ rootJitter });
  }, [rootJitter]);
  useEffect(() => {
    const p = Math.max(0, Math.min(1, Number(rootJitterProb)));
    setRootJitterProb(p);
    writeAdvancedCfg({ rootJitterProb: p });
    props.onChangeIaConfig({ rootJitterProb: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootJitterProb]);
  useEffect(() => {
    writeAdvancedCfg({ rootLMR });
    props.onChangeIaConfig({ rootLMR });
  }, [rootLMR]);
  useEffect(() => {
    const b = Math.max(0, Math.floor(drawBias));
    setDrawBias(b);
    writeAdvancedCfg({ drawBias: b });
    props.onChangeIaConfig({ drawBias: b });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawBias]);

  return (
    <fieldset style={{ border: '1px solid var(--border-color, #444)', padding: 8, borderRadius: 6 }}>
      <legend>Anti-estancamiento</legend>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 8, alignItems: 'center' }}>
        <label className="label" htmlFor="anti-novelty">Bonus novedad</label>
        <input id="anti-novelty" className="field-num" type="number" min={0} max={50} value={noveltyBonus} onChange={(e) => setNoveltyBonus(Number(e.target.value))} style={{ width: 90 }} />

        <label className="label" htmlFor="anti-topk">Top-K raíz</label>
        <input id="anti-topk" className="field-num" type="number" min={2} max={8} value={rootTopK} onChange={(e) => setRootTopK(Number(e.target.value))} style={{ width: 90 }} />

        <label className="label" htmlFor="anti-jitter">Jitter raíz</label>
        <input id="anti-jitter" type="checkbox" checked={rootJitter} onChange={(e) => setRootJitter(e.target.checked)} aria-checked={rootJitter} />

        <label className="label" htmlFor="anti-jprob">Prob. jitter</label>
        <input id="anti-jprob" className="field-num" type="number" min={0} max={1} step={0.01} value={rootJitterProb} onChange={(e) => setRootJitterProb(Number(e.target.value))} style={{ width: 90 }} />

        <label className="label" htmlFor="anti-lmr">LMR raíz</label>
        <input id="anti-lmr" type="checkbox" checked={rootLMR} onChange={(e) => setRootLMR(e.target.checked)} aria-checked={rootLMR} />

        <label className="label" htmlFor="anti-draw">Sesgo tablas (ciclos)</label>
        <input id="anti-draw" className="field-num" type="number" min={0} max={50} value={drawBias} onChange={(e) => setDrawBias(Number(e.target.value))} style={{ width: 90 }} />
      </div>
    </fieldset>
  );
}
