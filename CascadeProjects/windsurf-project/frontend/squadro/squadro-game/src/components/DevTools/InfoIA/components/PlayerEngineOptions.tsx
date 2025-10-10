import React from 'react';
import ToggleSwitch from '../../../ui/ToggleSwitch';

interface PlayerEngineOptionsProps {
  disabled?: boolean;
  enableTT?: boolean; onToggleEnableTT?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // Optional heuristic weights
  w_race?: number; onChangeWRace?: (n: number) => void;
  w_clash?: number; onChangeWClash?: (n: number) => void;
  w_sprint?: number; onChangeWSprint?: (n: number) => void;
  w_block?: number; onChangeWBlock?: (n: number) => void;
  done_bonus?: number; onChangeDoneBonus?: (n: number) => void;
  sprint_threshold?: number; onChangeSprintThreshold?: (n: number) => void;
  tempo?: number; onChangeTempo?: (n: number) => void;
}

const labelCls = 'text-xs text-neutral-300';
const inputCls = 'w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100';

const PlayerEngineOptions: React.FC<PlayerEngineOptionsProps> = (p) => {
  const dis = !!p.disabled;
  return (
    <div className="engine-opts mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>TT</span>
          <ToggleSwitch checked={!!p.enableTT} onChange={() => p.onToggleEnableTT?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>PVS</span>
          <ToggleSwitch checked={!!p.enablePVS} onChange={() => p.onToggleEnablePVS?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>Killers</span>
          <ToggleSwitch checked={!!p.enableKillers} onChange={() => p.onToggleEnableKillers?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>History</span>
          <ToggleSwitch checked={!!p.enableHistory} onChange={() => p.onToggleEnableHistory?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>Hash move</span>
          <ToggleSwitch checked={!!p.preferHashMove} onChange={() => p.onTogglePreferHashMove?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={labelCls}>LMR</span>
          <ToggleSwitch checked={!!p.enableLMR} onChange={() => p.onToggleEnableLMR?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className={labelCls + ' inline-flex items-center gap-2'}>
          minDepth
          <input type="number" disabled={dis} className={inputCls} value={p.lmrMinDepth ?? 3} onChange={(e) => p.onChangeLmrMinDepth?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'}>
          lateIdx
          <input type="number" disabled={dis} className={inputCls} value={p.lmrLateMoveIdx ?? 3} onChange={(e) => p.onChangeLmrLateMoveIdx?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'}>
          reduction
          <input type="number" disabled={dis} className={inputCls} value={p.lmrReduction ?? 1} onChange={(e) => p.onChangeLmrReduction?.(Number(e.target.value))} />
        </label>
      </div>
      {(typeof p.w_race === 'number' || typeof p.w_clash === 'number' || typeof p.w_sprint === 'number' || typeof p.w_block === 'number') && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-neutral-300 mb-1">Heurística (pesos)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              w_race
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_race ?? 1.0} onChange={(e) => p.onChangeWRace?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              w_clash
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_clash ?? 0.8} onChange={(e) => p.onChangeWClash?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              w_sprint
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_sprint ?? 0.6} onChange={(e) => p.onChangeWSprint?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              w_block
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_block ?? 0.3} onChange={(e) => p.onChangeWBlock?.(Number(e.target.value))} />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              done_bonus
              <input type="number" step={0.5} disabled={dis} className={inputCls} value={p.done_bonus ?? 5.0} onChange={(e) => p.onChangeDoneBonus?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              sprint_thr
              <input type="number" step={1} disabled={dis} className={inputCls} value={p.sprint_threshold ?? 2} onChange={(e) => p.onChangeSprintThreshold?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'}>
              tempo
              <input type="number" step={1} disabled={dis} className={inputCls} value={p.tempo ?? 5} onChange={(e) => p.onChangeTempo?.(Number(e.target.value))} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerEngineOptions;
