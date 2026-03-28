import { getPlayEllipse } from '../utils/dom';

export type Cfg = {
  stackStep: number;
  dropHighlight: boolean;
  freeMove: boolean;
  mergeThreshold: number;
  stackIndicatorVisible: boolean;
  flightCurveEnabled: boolean;
  flightCurveBend: number;
  /** Duración del vuelo de fichas en milisegundos (aplica a --flight-duration). */
  flightDurationMs: number;
  flightDestOffsetY: number;
  flightLingerMs: number;
  // Teleport FX toggles
  teleportRandom: boolean;         // Nueva partida Aleatorio
  teleportManualConfirm: boolean;  // Confirmar tablero en No Aleatorio
  teleportManualPick: boolean;     // Colocar ficha en celda en No Aleatorio
  /** Nivel de dificultad por defecto para la IA (1-30). */
  defaultDifficulty: number;
  /** Mostrar controles de dificultad en popovers (si se oculta, se usa la dificultad por defecto). */
  showDifficultyInPopovers: boolean;
};

export const LS_PREFIX = 'soluna:ui:';

const asNumber = (v: string | null | undefined, def: number): number => {
  const x = parseFloat((v || '').trim());
  return Number.isFinite(x) ? x : def;
};

/**
 * Lee una duración CSS y devuelve milisegundos.
 * Acepta valores como "1250ms" o "1.25s". Si no hay unidad, asume ms.
 */
const asDurationMs = (v: string | null | undefined, defMs: number): number => {
  const raw = (v || '').trim();
  if (!raw) return defMs;
  if (raw.endsWith('ms')) return Number.isFinite(parseFloat(raw)) ? Math.max(0, parseFloat(raw)) : defMs;
  if (raw.endsWith('s')) return Number.isFinite(parseFloat(raw)) ? Math.max(0, parseFloat(raw) * 1000) : defMs;
  return Number.isFinite(parseFloat(raw)) ? Math.max(0, parseFloat(raw)) : defMs;
};

export function readComputedCfg(el: HTMLElement | null = getPlayEllipse()): Cfg {
  const cs: CSSStyleDeclaration | null = el ? getComputedStyle(el) : null;
  const getVar = (name: string, fallback: string) => (cs?.getPropertyValue?.(name) || fallback);
  return {
    stackStep: asNumber(getVar('--stack-step', '18px'), 18),
    dropHighlight: asNumber(getVar('--drop-highlight', '1'), 1) > 0,
    freeMove: asNumber(getVar('--free-move', '1'), 1) > 0,
    mergeThreshold: asNumber(getVar('--merge-threshold-factor', '0.6'), 0.6),
    stackIndicatorVisible: asNumber(getVar('--stack-indicator-visible', '1'), 1) > 0,
    flightCurveEnabled: asNumber(getVar('--flight-curve-enabled', '1'), 1) > 0,
    flightCurveBend: asNumber(getVar('--flight-curve-bend', '0.22'), 0.22),
    flightDurationMs: asDurationMs(getVar('--flight-duration', '1250ms'), 1250),
    flightDestOffsetY: asNumber(getVar('--flight-dest-offset-y', '0px'), 0),
    flightLingerMs: asNumber(getVar('--flight-linger-ms', '250'), 250),
    teleportRandom: asNumber(getVar('--teleport-random', '1'), 1) > 0,
    teleportManualConfirm: asNumber(getVar('--teleport-manual-confirm', '1'), 1) > 0,
    teleportManualPick: asNumber(getVar('--teleport-manual-pick', '1'), 1) > 0,
    // Valores por defecto de dificultad (no dependen de CSS)
    defaultDifficulty: 10,
    showDifficultyInPopovers: true,
  };
}

export function applyCfg(cfg: Cfg, el: HTMLElement | null = getPlayEllipse()): void {
  if (!el) return;
  el.style.setProperty('--stack-step', `${cfg.stackStep}px`);
  el.style.setProperty('--drop-highlight', cfg.dropHighlight ? '1' : '0');
  el.style.setProperty('--free-move', cfg.freeMove ? '1' : '0');
  el.style.setProperty('--merge-threshold-factor', String(cfg.mergeThreshold));
  el.style.setProperty('--stack-indicator-visible', cfg.stackIndicatorVisible ? '1' : '0');
  el.style.setProperty('--flight-curve-enabled', cfg.flightCurveEnabled ? '1' : '0');
  el.style.setProperty('--flight-curve-bend', String(cfg.flightCurveBend));
  el.style.setProperty('--flight-duration', `${Math.max(0, Math.floor(cfg.flightDurationMs))}ms`);
  el.style.setProperty('--flight-dest-offset-y', `${cfg.flightDestOffsetY}px`);
  el.style.setProperty('--flight-linger-ms', String(cfg.flightLingerMs));
  // Teleport FX flags as CSS vars (read by Board)
  el.style.setProperty('--teleport-random', cfg.teleportRandom ? '1' : '0');
  el.style.setProperty('--teleport-manual-confirm', cfg.teleportManualConfirm ? '1' : '0');
  el.style.setProperty('--teleport-manual-pick', cfg.teleportManualPick ? '1' : '0');
}

export function resetInline(el: HTMLElement | null = getPlayEllipse()): void {
  if (!el) return;
  el.style.removeProperty('--stack-step');
  el.style.removeProperty('--drop-highlight');
  el.style.removeProperty('--free-move');
  el.style.removeProperty('--merge-threshold-factor');
  el.style.removeProperty('--stack-indicator-visible');
  el.style.removeProperty('--flight-curve-enabled');
  el.style.removeProperty('--flight-curve-bend');
  el.style.removeProperty('--flight-duration');
  el.style.removeProperty('--flight-dest-offset-y');
  el.style.removeProperty('--flight-linger-ms');
  // Also clear teleport FX flags
  el.style.removeProperty('--teleport-random');
  el.style.removeProperty('--teleport-manual-confirm');
  el.style.removeProperty('--teleport-manual-pick');
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
