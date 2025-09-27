import { useEffect, useMemo, useState } from 'react';
import type { AIAdvancedConfig } from '../../types';

const STORAGE_KEY = 'pylos.ia.advanced.v1';

type AntiStallSettingsProps = {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (cfg: Partial<AIAdvancedConfig>) => void;
};

type PersistPatch = Partial<{
  noveltyBonus: number;
  rootTopK: number;
  rootJitter: boolean;
  rootJitterProb: number;
  rootLMR: boolean;
  drawBias: number;
}>;

function readPersist(): PersistPatch {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const noveltyBonus = Number.isFinite(p?.noveltyBonus) ? Math.max(0, Math.floor(p.noveltyBonus)) : undefined;
    const rootTopK = Number.isFinite(p?.rootTopK) ? Math.max(2, Math.min(8, Math.floor(p.rootTopK))) : undefined;
    const rootJitter = typeof p?.rootJitter === 'boolean' ? !!p.rootJitter : undefined;
    const rootJitterProb = Number.isFinite(p?.rootJitterProb) ? Math.max(0, Math.min(1, Number(p.rootJitterProb))) : undefined;
    const rootLMR = typeof p?.rootLMR === 'boolean' ? !!p.rootLMR : undefined;
    const drawBias = Number.isFinite(p?.drawBias) ? Math.max(0, Math.floor(p.drawBias)) : undefined;
    return { noveltyBonus, rootTopK, rootJitter, rootJitterProb, rootLMR, drawBias };
  } catch {
    return {};
  }
}

function writePersist(patch: PersistPatch): void {
  try {
    const prev = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    })();
    const next = { ...prev, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export default function AntiStallSettings(props: AntiStallSettingsProps) {
  const init = useMemo(() => readPersist(), []);
  const [noveltyBonus, setNoveltyBonus] = useState<number>(init.noveltyBonus ?? 5);
  const [rootTopK, setRootTopK] = useState<number>(init.rootTopK ?? 3);
  const [rootJitter, setRootJitter] = useState<boolean>(init.rootJitter ?? true);
  const [rootJitterProb, setRootJitterProb] = useState<number>(init.rootJitterProb ?? 0.1);
  const [rootLMR, setRootLMR] = useState<boolean>(init.rootLMR ?? true);
  const [drawBias, setDrawBias] = useState<number>(init.drawBias ?? 5);

  useEffect(() => {
    writePersist({ noveltyBonus });
    props.onChangeIaConfig({ noveltyBonus });
  }, [noveltyBonus]);
  useEffect(() => {
    const v = Math.max(2, Math.min(8, Math.floor(rootTopK)));
    setRootTopK(v);
    writePersist({ rootTopK: v });
    props.onChangeIaConfig({ rootTopK: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootTopK]);
  useEffect(() => {
    writePersist({ rootJitter });
    props.onChangeIaConfig({ rootJitter });
  }, [rootJitter]);
  useEffect(() => {
    const p = Math.max(0, Math.min(1, Number(rootJitterProb)));
    setRootJitterProb(p);
    writePersist({ rootJitterProb: p });
    props.onChangeIaConfig({ rootJitterProb: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootJitterProb]);
  useEffect(() => {
    writePersist({ rootLMR });
    props.onChangeIaConfig({ rootLMR });
  }, [rootLMR]);
  useEffect(() => {
    const b = Math.max(0, Math.floor(drawBias));
    setDrawBias(b);
    writePersist({ drawBias: b });
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
