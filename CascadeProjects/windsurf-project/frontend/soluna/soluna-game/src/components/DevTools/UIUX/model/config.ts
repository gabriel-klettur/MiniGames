import { getPlayEllipse } from '../utils/dom';

export type Cfg = {
  stackStep: number;
  dropHighlight: boolean;
  freeMove: boolean;
  mergeThreshold: number;
  flightCurveEnabled: boolean;
  flightCurveBend: number;
  flightDestOffsetX: number;
  flightDestOffsetY: number;
};

export const LS_PREFIX = 'soluna:ui:';
export const LOG_LS_KEY = 'soluna:log:merges';

const asNumber = (v: string | null | undefined, def: number): number => {
  const x = parseFloat((v || '').trim());
  return Number.isFinite(x) ? x : def;
};

export function readComputedCfg(el: HTMLElement | null = getPlayEllipse()): Cfg {
  const cs: CSSStyleDeclaration | null = el ? getComputedStyle(el) : null;
  const getVar = (name: string, fallback: string) => (cs?.getPropertyValue?.(name) || fallback);
  return {
    stackStep: asNumber(getVar('--stack-step', '18px'), 18),
    dropHighlight: asNumber(getVar('--drop-highlight', '1'), 1) > 0,
    freeMove: asNumber(getVar('--free-move', '1'), 1) > 0,
    mergeThreshold: asNumber(getVar('--merge-threshold-factor', '0.6'), 0.6),
    flightCurveEnabled: asNumber(getVar('--flight-curve-enabled', '1'), 1) > 0,
    flightCurveBend: asNumber(getVar('--flight-curve-bend', '0.22'), 0.22),
    flightDestOffsetX: asNumber(getVar('--flight-dest-offset-x', '0px'), 0),
    flightDestOffsetY: asNumber(getVar('--flight-dest-offset-y', '0px'), 0),
  };
}

export function applyCfg(cfg: Cfg, el: HTMLElement | null = getPlayEllipse()): void {
  if (!el) return;
  el.style.setProperty('--stack-step', `${cfg.stackStep}px`);
  el.style.setProperty('--drop-highlight', cfg.dropHighlight ? '1' : '0');
  el.style.setProperty('--free-move', cfg.freeMove ? '1' : '0');
  el.style.setProperty('--merge-threshold-factor', String(cfg.mergeThreshold));
  el.style.setProperty('--flight-curve-enabled', cfg.flightCurveEnabled ? '1' : '0');
  el.style.setProperty('--flight-curve-bend', String(cfg.flightCurveBend));
  el.style.setProperty('--flight-dest-offset-x', `${cfg.flightDestOffsetX}px`);
  el.style.setProperty('--flight-dest-offset-y', `${cfg.flightDestOffsetY}px`);
}

export function resetInline(el: HTMLElement | null = getPlayEllipse()): void {
  if (!el) return;
  el.style.removeProperty('--stack-step');
  el.style.removeProperty('--drop-highlight');
  el.style.removeProperty('--free-move');
  el.style.removeProperty('--merge-threshold-factor');
  el.style.removeProperty('--flight-curve-enabled');
  el.style.removeProperty('--flight-curve-bend');
  el.style.removeProperty('--flight-dest-offset-x');
  el.style.removeProperty('--flight-dest-offset-y');
}

export function loadCfgLS(): Partial<Cfg> {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + 'cfg');
    return raw ? (JSON.parse(raw) as Partial<Cfg>) : {};
  } catch {
    return {};
  }
}

export function saveCfgLS(cfg: Cfg): void {
  try {
    window.localStorage.setItem(LS_PREFIX + 'cfg', JSON.stringify(cfg));
  } catch {}
}
