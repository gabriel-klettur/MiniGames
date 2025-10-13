import React, { useEffect, useState } from 'react';
import ToggleSwitch from '../../../ui/ToggleSwitch';

interface PlayerEngineOptionsProps {
  disabled?: boolean;
  /** Returns true when the given key differs between P1 and P2 panels */
  isDiff?: (key: string) => boolean;
  enableTT?: boolean; onToggleEnableTT?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // Ordering jitter
  orderingJitterEps?: number; onChangeOrderingJitterEps?: (n: number) => void;
  // Quiescence
  enableQuiescence?: boolean; onToggleEnableQuiescence?: () => void;
  quiescenceMaxPlies?: number; onChangeQuiescenceMaxPlies?: (n: number) => void;
  // Tablebase fast-path
  enableTablebase?: boolean; onToggleEnableTablebase?: () => void;
  // DF-PN
  enableDFPN?: boolean; onToggleEnableDFPN?: () => void;
  dfpnMaxActive?: number; onChangeDfpnMaxActive?: (n: number) => void;
  // Optional heuristic weights
  w_race?: number; onChangeWRace?: (n: number) => void;
  w_clash?: number; onChangeWClash?: (n: number) => void;
  w_sprint?: number; onChangeWSprint?: (n: number) => void;
  w_block?: number; onChangeWBlock?: (n: number) => void;
  // Extended heuristic weights (12-point scale)
  w_chain?: number; onChangeWChain?: (n: number) => void;
  w_parity?: number; onChangeWParity?: (n: number) => void;
  w_struct?: number; onChangeWStruct?: (n: number) => void;
  w_ones?: number; onChangeWOnes?: (n: number) => void;
  w_return?: number; onChangeWReturn?: (n: number) => void;
  w_waste?: number; onChangeWWaste?: (n: number) => void;
  w_mob?: number; onChangeWMob?: (n: number) => void;
  done_bonus?: number; onChangeDoneBonus?: (n: number) => void;
  sprint_threshold?: number; onChangeSprintThreshold?: (n: number) => void;
  // Repetition/draw bias
  drawScore?: number; onChangeDrawScore?: (n: number) => void;
  preferDrawWhenLosing?: boolean; onTogglePreferDrawWhenLosing?: () => void;
}

const labelCls = 'text-xs text-neutral-300';
const inputCls = 'w-full min-w-0 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100';

// Tooltip range/avg helper
const RANGE: Record<string, { min?: number; max?: number; avg?: number; values?: string }> = {
  // toggles (values shown instead of min/max)
  enableTT: { values: 'Off / On' },
  enableKillers: { values: 'Off / On' },
  enableHistory: { values: 'Off / On' },
  enablePVS: { values: 'Off / On' },
  enableLMR: { values: 'Off / On' },
  preferHashMove: { values: 'Off / On' },
  enableQuiescence: { values: 'Off / On' },
  enableTablebase: { values: 'Off / On' },
  enableDFPN: { values: 'Off / On' },
  enableLMP: { values: 'Off / On' },
  enableFutility: { values: 'Off / On' },
  enableAspiration: { values: 'Off / On' },
  enableIID: { values: 'Off / On' },
  enableAdaptiveTime: { values: 'Off / On' },
  quiescenceExtendOnRetire: { values: 'Off / On' },
  quiescenceExtendOnJump: { values: 'Off / On' },
  // numeric ranges
  orderingJitterEps: { min: 0, max: 5, avg: 0.5 },
  lmrMinDepth: { min: 1, max: 20, avg: 3 },
  lmrLateMoveIdx: { min: 0, max: 20, avg: 3 },
  lmrReduction: { min: 0, max: 3, avg: 1 },
  quiescenceMaxPlies: { min: 0, max: 8, avg: 4 },
  quiescenceStandPatMargin: { min: 0, max: 200, avg: 0 },
  quiescenceSeeMargin: { min: 0, max: 300, avg: 0 },
  dfpnMaxActive: { min: 0, max: 10, avg: 2 },
  lmpMaxDepth: { min: 0, max: 6, avg: 2 },
  lmpBase: { min: 0, max: 12, avg: 6 },
  futilityMargin: { min: 0, max: 400, avg: 150 },
  aspDelta: { min: 0, max: 100, avg: 25 },
  iidMinDepth: { min: 1, max: 10, avg: 3 },
  timeSlackMs: { min: 0, max: 500, avg: 50 },
  adaptiveGrowthFactor: { min: 0.5, max: 3, avg: 1.8 },
  adaptiveBFWeight: { min: 0, max: 0.5, avg: 0.05 },
  // heuristic weights
  w_race: { min: 0, max: 2, avg: 1.0 },
  w_clash: { min: 0, max: 100, avg: 50 },
  w_sprint: { min: 0, max: 20, avg: 8.0 },
  w_block: { min: 0, max: 20, avg: 10.0 },
  w_chain: { min: 0, max: 2, avg: 1.0 },
  w_parity: { min: 0, max: 2, avg: 1.0 },
  w_struct: { min: 0, max: 2, avg: 1.0 },
  w_ones: { min: 0, max: 2, avg: 1.0 },
  w_return: { min: 0, max: 2, avg: 1.0 },
  w_waste: { min: 0, max: 2, avg: 1.0 },
  w_mob: { min: 0, max: 2, avg: 1.0 },
  done_bonus: { min: 0, max: 400, avg: 200.0 },
  sprint_threshold: { min: 0, max: 4, avg: 2 },
  
  // repetition
  drawScore: { min: -50, max: 50, avg: 0 },
};

const stats = (key: string): string => {
  const r = RANGE[key];
  if (!r) return '';
  if (r.values) return ` — Valores: ${r.values}`;
  const parts: string[] = [];
  if (typeof r.min === 'number' && typeof r.max === 'number') parts.push(`Rango: ${r.min}–${r.max}`);
  if (typeof r.avg === 'number') parts.push(`Prom: ${r.avg}`);
  return parts.length ? ` — ${parts.join(' · ')}` : '';
};

const JitterInput: React.FC<{ value?: number; disabled?: boolean; onChange?: (n: number) => void }> = ({ value, disabled, onChange }) => {
  const [val, setVal] = useState<string>(String(value ?? 0));
  useEffect(() => { setVal(String(value ?? 0)); }, [value]);
  const commit = (v: string) => {
    const raw = (v || '').replace(',', '.');
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const num = Number(raw);
    if (Number.isFinite(num)) onChange?.(Math.max(0, num));
  };
  const parse = (): number => {
    const raw = (val || '').replace(',', '.');
    const num = Number(raw);
    return Number.isFinite(num) ? Math.max(0, num) : Math.max(0, Number(value ?? 0));
  };
  const step = (delta: number) => {
    const cur = parse();
    const next = Math.max(0, Math.round((cur + delta) * 10) / 10);
    setVal(String(next));
    onChange?.(next);
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        disabled={!!disabled}
        className={inputCls}
        value={val}
        onChange={(e) => { const v = e.target.value; setVal(v); commit(v); }}
        onBlur={() => { if (val === '' || val === '-' || val === '.' || val === '-.') setVal(String(value ?? 0)); }}
      />
      <button
        type="button"
        disabled={!!disabled}
        className="px-1 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); step(-0.1); }}
      >−</button>
      <button
        type="button"
        disabled={!!disabled}
        className="px-1 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); step(+0.1); }}
      >+</button>
    </span>
  );
};

const PlayerEngineOptions: React.FC<PlayerEngineOptionsProps> = (p) => {
  const dis = !!p.disabled;
  const hlInput = (key: string) => (p.isDiff?.(key) ? ' border-amber-400 outline outline-1 outline-amber-400' : '');
  const hlWrap = (key: string) => (p.isDiff?.(key) ? ' rounded border border-amber-400 px-1' : '');
  return (
    <div className="engine-opts mt-2 flex flex-col gap-3">
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Búsqueda y orden</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className={"inline-flex items-center gap-2" + hlWrap('enableTT')} title="Tabla de transposiciones (TT) — Cachea evaluaciones por hash de posición para reutilizarlas en nodos repetidos. Útil cuando distintas secuencias alcanzan el mismo tablero. Ejemplo: si A→B→C y D→E→C producen la misma posición C, TT puede devolver una cota (EXACT/LOWER/UPPER) en O(1) y evitar recalcular la rama completa.">
          <span className={labelCls}>TT</span>
          <ToggleSwitch checked={!!p.enableTT} onChange={() => p.onToggleEnableTT?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
      <div className={"inline-flex items-center gap-2" + hlWrap('orderingJitterEps')}>
        <label className={labelCls + ' inline-flex items-center gap-2'} title={"orderingJitterEps — Ruido leve en la prioridad del orden para romper empates deterministas. 0 desactiva; valores típicos 0.5–2.0." + stats('orderingJitterEps')}>
          jitter
          <JitterInput value={p.orderingJitterEps} disabled={dis} onChange={(n) => p.onChangeOrderingJitterEps?.(n)} />
        </label>
      </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enablePVS')} title={"Principal Variation Search (PVS) — Busca el primer hijo con ventana completa para establecer α; los siguientes con ventana nula [-α-1, -α]. Si alguno mejora α, se re-busca a ventana completa. Ejemplo: si el primer hijo da 15, el segundo se prueba con [-16,-15]; si devuelve 17, se re-busca a [-∞,+∞]." + stats('enablePVS')}>
          <span className={labelCls}>PVS</span>
          <ToggleSwitch checked={!!p.enablePVS} onChange={() => p.onToggleEnablePVS?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableKillers')} title={"Killer moves — Jugadas que causaron cortes β en el mismo nivel (ply) se prueban antes en ramas hermanas. Ejemplo: si mover P3 en este ply produjo un cutoff en otra rama, aquí también lo intentaremos temprano para forzar nuevas podas." + stats('enableKillers')}>
          <span className={labelCls}>Killers</span>
          <ToggleSwitch checked={!!p.enableKillers} onChange={() => p.onToggleEnableKillers?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableHistory')} title={"History heuristic — Puntúa jugadas por su éxito histórico elevando su prioridad en el orden. Ejemplo: si la jugada 'P2' frecuentemente mejora α, su puntuación de historia crece y se probará antes incluso sin ser táctica." + stats('enableHistory')}>
          <span className={labelCls}>History</span>
          <ToggleSwitch checked={!!p.enableHistory} onChange={() => p.onToggleEnableHistory?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('preferHashMove')} title={"Hash move (desde TT) — Si la TT sugiere una bestMove para la posición, se intenta primero para maximizar cortes β tempranos. Ejemplo: si TT recomienda mover 'P5', se eleva al frente del ordering para explorarla antes." + stats('preferHashMove')}>
          <span className={labelCls}>Hash move</span>
          <ToggleSwitch checked={!!p.preferHashMove} onChange={() => p.onTogglePreferHashMove?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableQuiescence')} title={"Quiescence — Extiende hojas tácticas (p. ej., capturas o swings) unos plies adicionales para estabilizar la evaluación y mitigar el 'horizon effect'. Recomendada ON con límite de qPlies moderado (3–5)." + stats('enableQuiescence')}>
          <span className={labelCls}>Quiescence</span>
          <ToggleSwitch checked={!!p.enableQuiescence} onChange={() => p.onToggleEnableQuiescence?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableTablebase')} title={"Tablebase — Atajo O(1) para posiciones conocidas (win/loss/draw) con mejor jugada. Si hay hit, devuelve inmediatamente sin buscar." + stats('enableTablebase')}>
          <span className={labelCls}>Tablebase</span>
          <ToggleSwitch checked={!!p.enableTablebase} onChange={() => p.onToggleEnableTablebase?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableDFPN')} title={"DF-PN — Activar búsqueda Proof-Number en finales pequeños. Útil para resolver subárboles con pocas piezas activas. Trigger por nº de piezas activas." + stats('enableDFPN')}>
          <span className={labelCls}>DF‑PN</span>
          <ToggleSwitch checked={!!p.enableDFPN} onChange={() => p.onToggleEnableDFPN?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('enableLMR')} title={"Late Move Reductions (LMR) — Reduce la profundidad efectiva de jugadas tardías (no tácticas) y re-busca a profundidad completa si superan α. Ejemplo: en movimientos con índice ≥ lateIdx, buscar a d-1 o d-2 con ventana nula; si el score supera α, repetir búsqueda completa." + stats('enableLMR')}>
          <span className={labelCls}>LMR</span>
          <ToggleSwitch checked={!!p.enableLMR} onChange={() => p.onToggleEnableLMR?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        </div>
      </section>
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Parámetros</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className={labelCls + ' flex flex-col gap-1'} title={"LMR:minDepth — Profundidad mínima a partir de la cual considerar reducciones. Ejemplo: con minDepth=3, sólo se aplican reducciones cuando depth≥3." + stats('lmrMinDepth')}>
          minDepth
          <input type="number" disabled={dis} className={inputCls + hlInput('lmrMinDepth')} value={p.lmrMinDepth ?? 3} onChange={(e) => p.onChangeLmrMinDepth?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' flex flex-col gap-1'} title={"LMR:lateIdx — Considera 'jugada tardía' a partir de este índice en el orden. Ejemplo: lateIdx=3 ⇒ sólo desde el 4º movimiento (0,1,2 son tempranos)." + stats('lmrLateMoveIdx')}>
          lateIdx
          <input type="number" disabled={dis} className={inputCls + hlInput('lmrLateMoveIdx')} value={p.lmrLateMoveIdx ?? 3} onChange={(e) => p.onChangeLmrLateMoveIdx?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' flex flex-col gap-1'} title={"LMR:reduction — Plies a reducir para jugadas tardías no tácticas. Ejemplo: reduction=1 ⇒ profundidad efectiva d-1 (con salvaguarda de re-búsqueda si falla alto)." + stats('lmrReduction')}>
          reduction
          <input type="number" disabled={dis} className={inputCls + hlInput('lmrReduction')} value={p.lmrReduction ?? 1} onChange={(e) => p.onChangeLmrReduction?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' flex flex-col gap-1'} title={"Quiescence:qPlies — Límite de extensiones de búsqueda táctica en hojas. Controla coste. Ejemplo: 4 ⇒ hasta 4 plies adicionales sólo en posiciones ruidosas." + stats('quiescenceMaxPlies')}>
          qPlies
          <input type="number" disabled={dis} className={inputCls + hlInput('quiescenceMaxPlies')} value={p.quiescenceMaxPlies ?? 4} onChange={(e) => p.onChangeQuiescenceMaxPlies?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' flex flex-col gap-1'} title={"Quiescence:standPatMargin — Margen restado al stand‑pat para cortes. 0 desactiva." + stats('quiescenceStandPatMargin')}>
          standPatMargin
          <input type="number" disabled={dis} className={inputCls + hlInput('quiescenceStandPatMargin')} value={(p as any).quiescenceStandPatMargin ?? 0} onChange={(e) => (p as any).onChangeQuiescenceStandPatMargin?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' flex flex-col gap-1'} title={"Quiescence:seeMargin — Umbral tipo SEE para expandir jugadas tácticas." + stats('quiescenceSeeMargin')}>
          seeMargin
          <input type="number" disabled={dis} className={inputCls + hlInput('quiescenceSeeMargin')} value={(p as any).quiescenceSeeMargin ?? 0} onChange={(e) => (p as any).onChangeQuiescenceSeeMargin?.(Number(e.target.value))} />
        </label>
        <div className={"inline-flex items-center gap-2" + hlWrap('quiescenceExtendOnRetire')} title={"Extender quiescence si una jugada retira una pieza (no consume qDepth)." + stats('quiescenceExtendOnRetire')}>
          <span className={labelCls}>qExtendRetire</span>
          <ToggleSwitch checked={!!(p as any).quiescenceExtendOnRetire} onChange={() => (p as any).onToggleQuiescenceExtendOnRetire?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className={"inline-flex items-center gap-2" + hlWrap('quiescenceExtendOnJump')} title={"Extender quiescence si una jugada produce un salto inmediato." + stats('quiescenceExtendOnJump')}>
          <span className={labelCls}>qExtendJump</span>
          <ToggleSwitch checked={!!(p as any).quiescenceExtendOnJump} onChange={() => (p as any).onToggleQuiescenceExtendOnJump?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <label className={labelCls + ' flex flex-col gap-1'} title={"DF‑PN:maxActive — Activa DF‑PN cuando las piezas activas (no retiradas) sean ≤ este valor. Conservador: 2 por defecto." + stats('dfpnMaxActive')}>
          dfpnActive
          <input type="number" disabled={dis} className={inputCls + hlInput('dfpnMaxActive')} value={p.dfpnMaxActive ?? 2} onChange={(e) => p.onChangeDfpnMaxActive?.(Number(e.target.value))} />
        </label>
        </div>
      </section>
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Podas heurísticas (LMP / Futility)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className={"inline-flex items-center gap-2" + hlWrap('enableLMP')} title={"LMP — Poda jugadas muy tardías no tácticas a baja profundidad. Acelera pero no es estrictamente exacto." + stats('enableLMP')}>
            <span className={labelCls}>LMP</span>
            <ToggleSwitch checked={!!(p as any).enableLMP} onChange={() => (p as any).onToggleEnableLMP?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
          <label className={labelCls + ' flex flex-col gap-1'} title={"lmpMaxDepth — Aplica LMP cuando depth ≤ este valor." + stats('lmpMaxDepth')}>
            <span>lmpMaxDepth</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('lmpMaxDepth')} value={(p as any).lmpMaxDepth ?? 2} onChange={(e) => (p as any).onChangeLmpMaxDepth?.(Number(e.target.value))} />
          </label>
          <label className={labelCls + ' flex flex-col gap-1'} title={"lmpBase — Umbral base del índice 'late'. Umbral = lmpBase + 2*depth." + stats('lmpBase')}>
            <span>lmpBase</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('lmpBase')} value={(p as any).lmpBase ?? 6} onChange={(e) => (p as any).onChangeLmpBase?.(Number(e.target.value))} />
          </label>
          <div className={"inline-flex items-center gap-2" + hlWrap('enableFutility')} title={"Futility — Poda nodos poco prometedores (no‑PV, baja profundidad, no tácticos). Acelera pero no es estrictamente exacto." + stats('enableFutility')}>
            <span className={labelCls}>Futility</span>
            <ToggleSwitch checked={!!(p as any).enableFutility} onChange={() => (p as any).onToggleEnableFutility?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
          <label className={labelCls + ' flex flex-col gap-1'} title={"futilityMargin — Margen por ply usado para decidir la poda de futilidad." + stats('futilityMargin')}>
            <span>futilityMargin</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('futilityMargin')} value={(p as any).futilityMargin ?? 150} onChange={(e) => (p as any).onChangeFutilityMargin?.(Number(e.target.value))} />
          </label>
        </div>
      </section>
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Aspiration e IID</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className={"inline-flex items-center gap-2" + hlWrap('enableAspiration')} title={"Aspiration windows — Empieza con una ventana alrededor del score previo y re‑busca si falla." + stats('enableAspiration')}>
            <span className={labelCls}>Aspiration</span>
            <ToggleSwitch checked={!!(p as any).enableAspiration} onChange={() => (p as any).onToggleEnableAspiration?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
          <label className={labelCls + ' flex flex-col gap-1'} title={"aspDelta — Semiancho inicial de la ventana de aspiración." + stats('aspDelta')}>
            <span>aspDelta</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('aspDelta')} value={(p as any).aspDelta ?? 25} onChange={(e) => (p as any).onChangeAspDelta?.(Number(e.target.value))} />
          </label>
          <div className={"inline-flex items-center gap-2" + hlWrap('enableIID')} title={"IID — Sonda a depth‑1 para sembrar el orden cuando no hay hash move." + stats('enableIID')}>
            <span className={labelCls}>IID</span>
            <ToggleSwitch checked={!!(p as any).enableIID} onChange={() => (p as any).onToggleEnableIID?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
          <label className={labelCls + ' flex flex-col gap-1'} title={"iidMinDepth — Solo aplicar IID cuando la profundidad actual sea ≥ este valor." + stats('iidMinDepth')}>
            <span>iidMinDepth</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('iidMinDepth')} value={(p as any).iidMinDepth ?? 3} onChange={(e) => (p as any).onChangeIidMinDepth?.(Number(e.target.value))} />
          </label>
        </div>
      </section>
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Tiempo adaptativo</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className={"inline-flex items-center gap-2" + hlWrap('enableAdaptiveTime')} title={"Tiempo adaptativo — Evita iniciar una iteración si el tiempo restante no alcanza. Solo tiene efecto con límite de tiempo finito." + stats('enableAdaptiveTime')}>
            <span className={labelCls}>Adaptive</span>
            <ToggleSwitch checked={!!(p as any).enableAdaptiveTime} onChange={() => (p as any).onToggleEnableAdaptiveTime?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
          <label className={labelCls + ' flex flex-col gap-1'} title={"timeSlackMs — Margen (ms) reservado para evitar pasarse del presupuesto." + stats('timeSlackMs')}>
            <span>timeSlackMs</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('timeSlackMs')} value={(p as any).timeSlackMs ?? 50} onChange={(e) => (p as any).onChangeTimeSlackMs?.(Number(e.target.value))} />
          </label>
          <label className={labelCls + ' flex flex-col gap-1'} title={"adaptiveGrowthFactor — Crecimiento base estimado del coste de la próxima iteración." + stats('adaptiveGrowthFactor')}>
            <span>growthFactor</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('adaptiveGrowthFactor')} value={(p as any).adaptiveGrowthFactor ?? 1.8} onChange={(e) => (p as any).onChangeAdaptiveGrowthFactor?.(Number(e.target.value))} />
          </label>
          <label className={labelCls + ' flex flex-col gap-1'} title={"adaptiveBFWeight — Peso extra por factor de ramificación en raíz (ajusta el crecimiento)." + stats('adaptiveBFWeight')}>
            <span>bfWeight</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('adaptiveBFWeight')} value={(p as any).adaptiveBFWeight ?? 0.05} onChange={(e) => (p as any).onChangeAdaptiveBFWeight?.(Number(e.target.value))} />
          </label>
        </div>
      </section>
      <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
        <div className="text-xs font-semibold text-neutral-300 mb-2">Tablas / Repetición</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className={labelCls + ' flex flex-col gap-1' + hlWrap('drawScore')} title={"drawScore — Valor devuelto al detectar repetición (tablas)." + stats('drawScore')}>
            <span>drawScore</span>
            <input type="number" disabled={dis} className={inputCls + hlInput('drawScore')} value={(p as any).drawScore ?? 0} onChange={(e) => (p as any).onChangeDrawScore?.(Number(e.target.value))} />
          </label>
          <div className={"inline-flex items-center gap-2" + hlWrap('preferDrawWhenLosing')} title={"preferDrawWhenLosing — Futuro sesgo para preferir tablas en líneas perdedoras (cuando aplique)." + stats('enableTT')}>
            <span className={labelCls}>preferDrawWhenLosing</span>
            <ToggleSwitch checked={!!(p as any).preferDrawWhenLosing} onChange={() => (p as any).onTogglePreferDrawWhenLosing?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
          </div>
        </div>
      </section>
      {(typeof p.w_race === 'number' || typeof p.w_clash === 'number' || typeof p.w_sprint === 'number' || typeof p.w_block === 'number') && (
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
          <div className="text-xs font-semibold text-neutral-300 mb-2">Heurística (pesos)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_race')} title={"w_race — Carrera (100 pts ≈ 1 tempo): multiplica el score de carrera basado en top‑4 turnos sin interacción." + stats('w_race')}>
              w_race
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_race')} value={p.w_race ?? 1.0} onChange={(e) => p.onChangeWRace?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_clash')} title={"w_clash — Captura inmediata (50 pts por captura): pondera el swing por send‑backs inmediatos (1 ply)." + stats('w_clash')}>
              w_clash
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_clash')} value={p.w_clash ?? 50.0} onChange={(e) => p.onChangeWClash?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_sprint')} title={"w_sprint — Sprint final: incentiva cerrar cuando alguna pieza está a pocos turnos de retirarse. Ejemplo: si una pieza está a ≤ sprint_thr, se suma un bonus proporcional." + stats('w_sprint')}>
              w_sprint
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_sprint')} value={p.w_sprint ?? 8.0} onChange={(e) => p.onChangeWSprint?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_block')} title={"w_block — Bloqueo útil vs. exposición: favorece tapar rutas rivales en ≤2 pasos y penaliza quedar al alcance inmediato del rival. Ejemplo: si tras tu mejor avance de prueba el rival te alcanza fácil, se resta puntuación." + stats('w_block')}>
              w_block
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_block')} value={p.w_block ?? 10.0} onChange={(e) => p.onChangeWBlock?.(Number(e.target.value))} />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('done_bonus')} title={"done_bonus — Bonus por piezas retiradas. Ejemplo: cada pieza en 'retirada' suma este bonus (además del progreso de carrera acumulado)." + stats('done_bonus')}>
              done_bonus
              <input type="number" step={0.5} disabled={dis} className={inputCls + hlInput('done_bonus')} value={p.done_bonus ?? 5.0} onChange={(e) => p.onChangeDoneBonus?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('sprint_threshold')} title={"sprint_thr — Umbral de turnos que activa el bonus de sprint. Ejemplo: con sprint_thr=2, piezas a 1–2 turnos de retirarse disparan el término de sprint (positivo para ti, negativo si es del rival)." + stats('sprint_threshold')}>
              sprint_thr
              <input type="number" step={1} disabled={dis} className={inputCls + hlInput('sprint_threshold')} value={p.sprint_threshold ?? 2} onChange={(e) => p.onChangeSprintThreshold?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_chain')} title={"w_chain — Multiplicador para el bonus de cadena de capturas (15 por pieza adicional)." + stats('w_chain')}>
              w_chain
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_chain')} value={(p as any).w_chain ?? 1.0} onChange={(e) => (p as any).onChangeWChain?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_parity')} title={"w_parity — Multiplicador para la paridad de cruces (+12 por cruce ganado)." + stats('w_parity')}>
              w_parity
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_parity')} value={(p as any).w_parity ?? 1.0} onChange={(e) => (p as any).onChangeWParity?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_struct')} title={"w_struct — Multiplicador para bloqueos estructurales de línea (+10 por línea sofocada)." + stats('w_struct')}>
              w_struct
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_struct')} value={(p as any).w_struct ?? 1.0} onChange={(e) => (p as any).onChangeWStruct?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_ones')} title={"w_ones — Multiplicador para seguridad/vulnerabilidad de '1' (±30 por pieza)." + stats('w_ones')}>
              w_ones
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_ones')} value={(p as any).w_ones ?? 1.0} onChange={(e) => (p as any).onChangeWOnes?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_return')} title={"w_return — Multiplicador para valor de retorno (propio en_vuelta +5, rival en_ida −5)." + stats('w_return')}>
              w_return
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_return')} value={(p as any).w_return ?? 1.0} onChange={(e) => (p as any).onChangeWReturn?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_waste')} title={"w_waste — Multiplicador para waste move disponible sin riesgo (+8 diferencial)." + stats('w_waste')}>
              w_waste
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_waste')} value={(p as any).w_waste ?? 1.0} onChange={(e) => (p as any).onChangeWWaste?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2' + hlWrap('w_mob')} title={"w_mob — Multiplicador para movilidad segura (+6 diferencial)." + stats('w_mob')}>
              w_mob
              <input type="number" step={0.1} disabled={dis} className={inputCls + hlInput('w_mob')} value={(p as any).w_mob ?? 1.0} onChange={(e) => (p as any).onChangeWMob?.(Number(e.target.value))} />
            </label>
          </div>
        </section>
      )}
    </div>
  );
}
;

export default PlayerEngineOptions;
