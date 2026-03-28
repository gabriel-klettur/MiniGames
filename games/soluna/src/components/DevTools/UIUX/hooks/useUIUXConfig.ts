import { useEffect, useMemo, useState } from 'react';
import { applyCfg, loadCfgLS, readComputedCfg, resetInline, saveCfgLS } from '../model/config';
import type { Cfg } from '../model/config';

export function useUIUXConfig() {
  const initial = useMemo<Cfg>(() => ({ ...readComputedCfg(), ...loadCfgLS(), flightCurveEnabled: true } as Cfg), []);
  const [cfg, setCfg] = useState<Cfg>(initial);

  useEffect(() => {
    applyCfg(cfg);
    saveCfgLS(cfg);
    try {
      const ev = new CustomEvent('soluna:ui:cfg-updated', { detail: cfg });
      window.dispatchEvent(ev);
    } catch {}
  }, [cfg]);

  const onNum = (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : parseFloat(e.target.value);
    setCfg((c) => ({ ...c, [k]: v } as Cfg));
  };

  const reset = () => {
    const defaults = readComputedCfg();
    setCfg({ ...defaults, flightCurveEnabled: true });
    resetInline();
    try { window.localStorage.removeItem('soluna:ui:cfg'); } catch {}
  };

  return { cfg, setCfg, onNum, reset } as const;
}
