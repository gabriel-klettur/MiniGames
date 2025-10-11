// IA Presets for Squadro — persistence and defaults
// Mirrors the Soluna pattern but adapted to Squadro state shape

// speed has been removed from UI; presets now rely only on timeMode/timeSeconds

export interface IAPreset {
  id: string;
  name: string;
  settings: {
    difficulty?: number; // 1..20
    useWorkers?: boolean;
    timeMode?: 'auto' | 'manual';
    timeSeconds?: number;     // when manual
    // Tiempo (Auto)
    aiTimeMinMs?: number;
    aiTimeMaxMs?: number;
    aiTimeBaseMs?: number;
    aiTimePerMoveMs?: number;
    aiTimeExponent?: number;
    // Engine toggles
    enableTT?: boolean;
    failSoft?: boolean;
    preferHashMove?: boolean;
    enablePVS?: boolean;
    enableKillers?: boolean;
    enableHistory?: boolean;
    enableLMR?: boolean;
    // Quiescence
    enableQuiescence?: boolean;
    quiescenceMaxPlies?: number;
    // LMR params
    lmrMinDepth?: number;
    lmrLateMoveIdx?: number;
    lmrReduction?: number;
    // Move ordering jitter (stochastic tie-breaker)
    orderingJitterEps?: number;
    // Heuristic weights (global: applied to Light and Dark)
    evalWeights?: {
      w_race?: number;
      w_clash?: number;
      w_sprint?: number;
      w_block?: number;
      done_bonus?: number;
      sprint_threshold?: number;
      tempo?: number;
    };
  };
}

export const IA_PRESETS_KEY = 'squadro:ia:presets';
export const IA_SELECTED_KEY = 'squadro:ia:selected';

export function getDefaultPresets(): IAPreset[] {
  return [
    {
      id: 'iapowa',
      name: 'IAPowa',
      settings: {
        difficulty: 10,
        useWorkers: true,
        timeMode: 'auto',
        timeSeconds: 0,
        // Motor robusto
        enableTT: true,
        failSoft: true,
        preferHashMove: true,
        enablePVS: true,
        enableKillers: true,
        enableHistory: true,
        enableLMR: true,
        // Quiescence
        enableQuiescence: true,
        quiescenceMaxPlies: 4,
        // LMR conservador
        lmrMinDepth: 3,
        lmrLateMoveIdx: 3,
        lmrReduction: 1,
        // Heurística (global) balanceada para no perder
        evalWeights: {
          w_race: 1.2,
          w_clash: 1.0,
          w_sprint: 0.7,
          w_block: 0.4,
          done_bonus: 6.0,
          sprint_threshold: 2,
          tempo: 6,
        },
      },
    },
    {
      id: 'iapowa_perf',
      name: 'IAPowa+Rendimiento',
      settings: { difficulty: 4, useWorkers: true, timeMode: 'manual', timeSeconds: 5 },
    },
    {
      id: 'iapowa_def',
      name: 'IAPowa+Defensa',
      settings: { difficulty: 5, useWorkers: true, timeMode: 'manual', timeSeconds: 30 },
    },
  ];
}

export function loadPresets(): IAPreset[] {
  try {
    const raw = localStorage.getItem(IA_PRESETS_KEY);
    if (!raw) {
      const def = getDefaultPresets();
      localStorage.setItem(IA_PRESETS_KEY, JSON.stringify(def));
      return def;
    }
    const parsed = JSON.parse(raw) as IAPreset[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('invalid presets');
    return parsed;
  } catch {
    const def = getDefaultPresets();
    try { localStorage.setItem(IA_PRESETS_KEY, JSON.stringify(def)); } catch {}
    return def;
  }
}

export function savePresets(presets: IAPreset[]): void {
  localStorage.setItem(IA_PRESETS_KEY, JSON.stringify(presets));
}

export function getSelectedPresetId(): string | null {
  try {
    return localStorage.getItem(IA_SELECTED_KEY);
  } catch { return null; }
}

export function setSelectedPresetId(id: string): void {
  try { localStorage.setItem(IA_SELECTED_KEY, id); } catch {}
}

export function findPresetById(id: string, inList?: IAPreset[]): IAPreset | null {
  const list = inList ?? loadPresets();
  return list.find((p) => p.id === id) ?? null;
}
