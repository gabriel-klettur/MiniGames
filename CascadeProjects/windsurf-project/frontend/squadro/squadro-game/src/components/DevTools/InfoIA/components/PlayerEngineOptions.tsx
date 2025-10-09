import React from 'react';
import ToggleSwitch from '../../../ui/ToggleSwitch';

interface PlayerEngineOptionsProps {
  disabled?: boolean;
  enableTT?: boolean; onToggleEnableTT?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
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
    </div>
  );
};

export default PlayerEngineOptions;
