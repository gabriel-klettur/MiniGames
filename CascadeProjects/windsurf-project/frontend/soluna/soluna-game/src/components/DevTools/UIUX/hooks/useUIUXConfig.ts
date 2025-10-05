import { useEffect, useMemo, useState } from 'react';
import { applyCfg, loadCfgLS, LOG_LS_KEY, readComputedCfg, resetInline, saveCfgLS } from '../model/config';
import type { Cfg } from '../model/config';

export function useUIUXConfig() {
  const initial = useMemo<Cfg>(() => ({ ...readComputedCfg(), ...loadCfgLS(), flightCurveEnabled: true } as Cfg), []);
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [logMerges, setLogMerges] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem(LOG_LS_KEY);
      return raw == null ? true : raw !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    applyCfg(cfg);
    saveCfgLS(cfg);
  }, [cfg]);

  useEffect(() => {
    try { (window as any).solunaLogMerges?.(logMerges); } catch {}
    try { window.localStorage.setItem(LOG_LS_KEY, logMerges ? '1' : '0'); } catch {}
  }, [logMerges]);

  const onNum = (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : parseFloat(e.target.value);
    setCfg((c) => ({ ...c, [k]: v } as Cfg));
  };

  const reset = () => {
    const defaults = readComputedCfg();
    setCfg({ ...defaults, flightCurveEnabled: true });
    resetInline();
    try { window.localStorage.removeItem('soluna:ui:cfg'); } catch {}
    // Also reset Indicators-related toggle to defaults
    setLogMerges(true);
    try { window.localStorage.removeItem(LOG_LS_KEY); } catch {}
  };

  return { cfg, setCfg, onNum, reset, logMerges, setLogMerges } as const;
}
