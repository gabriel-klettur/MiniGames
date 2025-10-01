export const STORAGE_KEY = 'pylos.ia.advanced.v1';
export const PLAYERS_STORAGE_KEY = 'pylos.ia.advanced.v1.players';

export type PlayerId = 'L' | 'D';

export type AdvancedCfg = {
  startRandomFirstMove?: boolean;
  startSeed?: number | null;
  // Global repetition toggle (root-level behavior)
  avoidRepeats?: boolean;
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
  // Optional per-player basic settings
  depth?: number;
  timeMode?: 'auto' | 'manual';
  timeSeconds?: number;
  // New: per-player diversification controls and engine options
  diversify?: 'off' | 'epsilon' | 'adaptive';
  epsilon?: number;
  tieDelta?: number;
  workers?: 'auto' | number;
  bookEnabled?: boolean;
  // Engine bitboards toggle (per-player)
  bitboardsEnabled?: boolean;
};

export const DEFAULTS: Required<Pick<AdvancedCfg,
  'repeatMax' | 'avoidPenalty' | 'noveltyBonus' | 'rootTopK' | 'rootJitter' |
  'rootJitterProb' | 'rootLMR' | 'drawBias' | 'timeRiskEnabled' | 'noProgressLimit' |
  'avoidStepFactor' | 'persistAntiLoopsEnabled' | 'halfLifeDays' | 'persistCap' | 'diversify' | 'epsilon' | 'tieDelta'
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
  diversify: 'adaptive',
  epsilon: 0.1,
  tieDelta: 20,
};

export function readAdvancedCfg(): AdvancedCfg {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const avoidRepeats = typeof p?.avoidRepeats === 'boolean' ? !!p.avoidRepeats : undefined;
    const startRandomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : undefined;
    const startSeed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : (p?.startSeed === null ? null : undefined);
    const repeatMax = Number.isFinite(p?.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : undefined;
    const avoidPenalty = Number.isFinite(p?.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : undefined;
    const noveltyBonus = Number.isFinite(p?.noveltyBonus) ? Math.max(0, Math.floor(p.noveltyBonus)) : undefined;
    const rootTopK = Number.isFinite(p?.rootTopK) ? Math.max(1, Math.min(8, Math.floor(p.rootTopK))) : undefined;
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
    const depth = Number.isFinite(p?.depth) ? Math.max(1, Math.min(20, Math.floor(p.depth))) : undefined;
    const timeMode = p?.timeMode === 'auto' || p?.timeMode === 'manual' ? p.timeMode : undefined;
    const timeSeconds = Number.isFinite(p?.timeSeconds) ? Math.max(1, Math.min(60, Math.floor(p.timeSeconds))) : undefined;
    const diversify = (p?.diversify === 'off' || p?.diversify === 'epsilon' || p?.diversify === 'adaptive') ? p.diversify : undefined;
    const epsilon = Number.isFinite(p?.epsilon) ? Math.max(0, Math.min(1, Number(p.epsilon))) : undefined;
    const tieDelta = Number.isFinite(p?.tieDelta) ? Math.max(0, Math.min(100, Math.floor(p.tieDelta))) : undefined;
    const workers = (p?.workers === 'auto' || Number.isFinite(p?.workers)) ? (p.workers === 'auto' ? 'auto' : Math.max(1, Math.min(16, Math.floor(p.workers)))) : undefined;
    const bookEnabled = typeof p?.bookEnabled === 'boolean' ? !!p.bookEnabled : undefined;
    const bitboardsEnabled = typeof p?.bitboardsEnabled === 'boolean' ? !!p.bitboardsEnabled : undefined;
    return {
      avoidRepeats,
      startRandomFirstMove,
      startSeed,
      repeatMax,
      avoidPenalty,
      noveltyBonus,
      rootTopK,
      rootJitter,
      rootJitterProb,
      rootLMR,
      drawBias,
      timeRiskEnabled,
      noProgressLimit,
      avoidStepFactor,
      persistAntiLoopsEnabled,
      halfLifeDays,
      persistCap,
      depth,
      timeMode,
      timeSeconds,
      diversify,
      epsilon,
      tieDelta,
      workers,
      bookEnabled,
      bitboardsEnabled,
    };
  } catch {
    return {};
  }
}

// Keep legacy writers for compatibility with existing components
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

// --- Per-player storage helpers (L/D) ---

type PlayersCfg = { L: AdvancedCfg; D: AdvancedCfg };

function sanitizeCfg(p: any): AdvancedCfg {
  try {
    const startRandomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : undefined;
    const startSeed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : (p?.startSeed === null ? null : undefined);
    const repeatMax = Number.isFinite(p?.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : undefined;
    const avoidPenalty = Number.isFinite(p?.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : undefined;
    const noveltyBonus = Number.isFinite(p?.noveltyBonus) ? Math.max(0, Math.floor(p.noveltyBonus)) : undefined;
    const rootTopK = Number.isFinite(p?.rootTopK) ? Math.max(1, Math.min(8, Math.floor(p.rootTopK))) : undefined;
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
    const depth = Number.isFinite(p?.depth) ? Math.max(1, Math.min(20, Math.floor(p.depth))) : undefined;
    const timeMode = p?.timeMode === 'auto' || p?.timeMode === 'manual' ? p.timeMode : undefined;
    const timeSeconds = Number.isFinite(p?.timeSeconds) ? Math.max(1, Math.min(60, Math.floor(p.timeSeconds))) : undefined;
    const diversify = (p?.diversify === 'off' || p?.diversify === 'epsilon' || p?.diversify === 'adaptive') ? p.diversify : undefined;
    const epsilon = Number.isFinite(p?.epsilon) ? Math.max(0, Math.min(1, Number(p.epsilon))) : undefined;
    const tieDelta = Number.isFinite(p?.tieDelta) ? Math.max(0, Math.min(100, Math.floor(p.tieDelta))) : undefined;
    const workers = (p?.workers === 'auto' || Number.isFinite(p?.workers)) ? (p.workers === 'auto' ? 'auto' : Math.max(1, Math.min(16, Math.floor(p.workers)))) : undefined;
    const bookEnabled = typeof p?.bookEnabled === 'boolean' ? !!p.bookEnabled : undefined;
    return {
      startRandomFirstMove,
      startSeed,
      repeatMax,
      avoidPenalty,
      noveltyBonus,
      rootTopK,
      rootJitter,
      rootJitterProb,
      rootLMR,
      drawBias,
      timeRiskEnabled,
      noProgressLimit,
      avoidStepFactor,
      persistAntiLoopsEnabled,
      halfLifeDays,
      persistCap,
      depth,
      timeMode,
      timeSeconds,
      diversify,
      epsilon,
      tieDelta,
      workers,
      bookEnabled,
    };
  } catch {
    return {};
  }
}
function readPlayersCfg(): PlayersCfg | null {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const L = sanitizeCfg(p?.L ?? {});
    const D = sanitizeCfg(p?.D ?? {});
    return { L, D };
  } catch { return null; }
}

function writePlayersCfg(next: PlayersCfg): void {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function ensurePlayersCfg(): PlayersCfg {
  const existing = readPlayersCfg();
  if (existing) return existing;
  // Migrate from legacy single-key storage: use same values for both players as baseline
  const legacy = readAdvancedCfg();
  const base: AdvancedCfg = { ...legacy };
  const initial: PlayersCfg = { L: base, D: base };
  writePlayersCfg(initial);
  return initial;
}

export function readAdvancedCfgByPlayer(player: PlayerId): AdvancedCfg {
  const p = ensurePlayersCfg();
  return player === 'L' ? (p.L ?? {}) : (p.D ?? {});
}

export function writeAdvancedCfgByPlayer(player: PlayerId, patch: Partial<AdvancedCfg>): void {
  const all = ensurePlayersCfg();
  const prev = player === 'L' ? all.L : all.D;
  const next = { ...prev, ...patch };
  const merged: PlayersCfg = player === 'L' ? { L: next, D: all.D } : { L: all.L, D: next };
  writePlayersCfg(merged);
}

export function clearAdvancedCfgByPlayer(player: PlayerId): void {
  const all = ensurePlayersCfg();
  const empty: AdvancedCfg = {};
  const merged: PlayersCfg = player === 'L' ? { L: empty, D: all.D } : { L: all.L, D: empty };
  writePlayersCfg(merged);
}
