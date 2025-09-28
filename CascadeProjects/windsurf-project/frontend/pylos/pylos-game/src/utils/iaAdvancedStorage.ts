export const STORAGE_KEY = 'pylos.ia.advanced.v1';

export type AdvancedCfg = {
  startRandomFirstMove?: boolean;
  startSeed?: number | null;
  repeatMax?: number;
  avoidPenalty?: number;
  noveltyBonus?: number;
  rootTopK?: number;
  rootJitter?: boolean;
  rootJitterProb?: number;
  rootLMR?: boolean;
  drawBias?: number;
  timeRiskEnabled?: boolean;
  noProgressLimit?: number;
  avoidStepFactor?: number;
  persistAntiLoopsEnabled?: boolean;
  halfLifeDays?: number;
  persistCap?: number;
};

export const DEFAULTS: Required<Pick<AdvancedCfg,
  'repeatMax' | 'avoidPenalty' | 'noveltyBonus' | 'rootTopK' | 'rootJitter' |
  'rootJitterProb' | 'rootLMR' | 'drawBias' | 'timeRiskEnabled' | 'noProgressLimit' |
  'avoidStepFactor' | 'persistAntiLoopsEnabled' | 'halfLifeDays' | 'persistCap'
>> & { startRandomFirstMove: boolean; startSeed: null } = {
  startRandomFirstMove: true,
  startSeed: null,
  repeatMax: 3,
  avoidPenalty: 50,
  noveltyBonus: 5,
  rootTopK: 3,
  rootJitter: true,
  rootJitterProb: 0.1,
  rootLMR: true,
  drawBias: 5,
  timeRiskEnabled: true,
  noProgressLimit: 40,
  avoidStepFactor: 0.5,
  persistAntiLoopsEnabled: true,
  halfLifeDays: 7,
  persistCap: 300,
};

export function readAdvancedCfg(): AdvancedCfg {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const startRandomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : undefined;
    const startSeed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : null;
    const repeatMax = Number.isFinite(p?.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : undefined;
    const avoidPenalty = Number.isFinite(p?.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : undefined;
    const noveltyBonus = Number.isFinite(p?.noveltyBonus) ? Math.max(0, Math.floor(p.noveltyBonus)) : undefined;
    const rootTopK = Number.isFinite(p?.rootTopK) ? Math.max(2, Math.min(8, Math.floor(p.rootTopK))) : undefined;
    const rootJitter = typeof p?.rootJitter === 'boolean' ? !!p.rootJitter : undefined;
    const rootJitterProb = Number.isFinite(p?.rootJitterProb) ? Math.max(0, Math.min(1, Number(p.rootJitterProb))) : undefined;
    const rootLMR = typeof p?.rootLMR === 'boolean' ? !!p.rootLMR : undefined;
    const drawBias = Number.isFinite(p?.drawBias) ? Math.max(0, Math.floor(p.drawBias)) : undefined;
    const timeRiskEnabled = typeof p?.timeRiskEnabled === 'boolean' ? !!p.timeRiskEnabled : undefined;
    const noProgressLimit = Number.isFinite(p?.noProgressLimit) ? Math.max(10, Math.min(400, Math.floor(p.noProgressLimit))) : undefined;
    const avoidStepFactor = Number.isFinite(p?.avoidStepFactor) ? Math.max(0, Math.min(2, Number(p.avoidStepFactor))) : undefined;
    const persistAntiLoopsEnabled = typeof p?.persistAntiLoopsEnabled === 'boolean' ? !!p.persistAntiLoopsEnabled : undefined;
    const halfLifeDays = Number.isFinite(p?.halfLifeDays) ? Math.max(1, Math.min(90, Math.floor(p.halfLifeDays))) : undefined;
    const persistCap = Number.isFinite(p?.persistCap) ? Math.max(50, Math.min(2000, Math.floor(p.persistCap))) : undefined;
    return { startRandomFirstMove, startSeed, repeatMax, avoidPenalty, noveltyBonus, rootTopK, rootJitter, rootJitterProb, rootLMR, drawBias, timeRiskEnabled, noProgressLimit, avoidStepFactor, persistAntiLoopsEnabled, halfLifeDays, persistCap };
  } catch {
    return {};
  }
}

export function writeAdvancedCfg(patch: Partial<AdvancedCfg>): void {
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

export function clearAdvancedCfg(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
