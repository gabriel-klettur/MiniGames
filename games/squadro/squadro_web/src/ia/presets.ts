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
    enableAdaptiveTime?: boolean;
    forceFullDepth?: boolean;
    // Pruning
    enableLMP?: boolean;
    lmpMaxDepth?: number;
    lmpBase?: number;
    enableFutility?: boolean;
    futilityMargin?: number;
    // IID
    enableIID?: boolean;
    iidMinDepth?: number;
    // Quiescence
    enableQuiescence?: boolean;
    quiescenceMaxPlies?: number;
    quiescenceStandPatMargin?: number;
    quiescenceSeeMargin?: number;
    quiescenceExtendOnRetire?: boolean;
    quiescenceExtendOnJump?: boolean;
    // LMR params
    lmrMinDepth?: number;
    lmrLateMoveIdx?: number;
    lmrReduction?: number;
    // Move ordering jitter (stochastic tie-breaker)
    orderingJitterEps?: number;
    // Opening randomization
    randomOpeningPlies?: number;
    // Heuristic weights (global: applied to Light and Dark)
    evalWeights?: {
      w_race?: number;
      w_clash?: number;
      w_sprint?: number;
      w_block?: number;
      done_bonus?: number;
      sprint_threshold?: number;
      // Extended (12-point) multipliers
      w_chain?: number;
      w_parity?: number;
      w_struct?: number;
      w_ones?: number;
      w_return?: number;
      w_waste?: number;
      w_mob?: number;
    };
  };
}

export const IA_PRESETS_KEY = 'squadro:ia:presets';
export const IA_SELECTED_KEY = 'squadro:ia:selected';

export function getDefaultPresets(): IAPreset[] {
  return [
    {
      id: 'iapowa_proof',
      name: 'IAPowa-Proof',
      settings: {
        difficulty: 12,
        useWorkers: true,
        timeMode: 'auto',
        timeSeconds: 0,
        // Determinista, máximo rigor
        enableTT: true,
        failSoft: true,
        preferHashMove: true,
        enablePVS: true,
        enableKillers: true,
        enableHistory: true,
        enableLMR: true,
        enableLMP: true,
        lmpMaxDepth: 2,
        lmpBase: 6,
        enableFutility: true,
        futilityMargin: 150,
        enableIID: true,
        iidMinDepth: 3,
        enableQuiescence: true,
        quiescenceMaxPlies: 4,
        quiescenceStandPatMargin: 0,
        quiescenceSeeMargin: 0,
        quiescenceExtendOnRetire: true,
        quiescenceExtendOnJump: true,
        lmrMinDepth: 3,
        lmrLateMoveIdx: 3,
        lmrReduction: 1,
        orderingJitterEps: 0,
        randomOpeningPlies: 0,
        evalWeights: {
          // Heurística por defecto (usuario)
          w_race: 2.0,
          w_clash: 1.0,
          w_sprint: 5.365895487831215,
          w_block: 13.542741590951847,
          done_bonus: 199.50580333275943,
          sprint_threshold: 2,
          // Extendidas (12 señales)
          w_chain: 1.9999991600001719,
          w_parity: 1.999999920000001,
          w_struct: 1.999999720000018,
          w_ones: 2.0,
          w_return: 1.99999996,
          w_waste: 2.0,
          w_mob: 2.0,
        },
      },
    },
    {
      id: 'iapowa',
      name: 'IAPowa',
      settings: {
        difficulty: 10,
        useWorkers: true,
        timeMode: 'auto',        // sin límite fijo, se usa profundidad 10
        timeSeconds: 0,
        // Motor robusto (máxima fuerza y estabilidad)
        enableTT: true,
        failSoft: true,
        preferHashMove: true,
        enablePVS: true,
        enableKillers: true,
        enableHistory: true,
        enableLMR: true,
        // Quiescence más profunda para estabilizar táctica
        enableQuiescence: true,
        quiescenceMaxPlies: 6,
        // LMR conservador (menos agresivo para no saltar táctica sutil)
        lmrMinDepth: 4,
        lmrLateMoveIdx: 3,
        lmrReduction: 1,
        // Ordenación determinista
        orderingJitterEps: 0,
        // Aperturas aleatorias desactivadas para solidez absoluta
        randomOpeningPlies: 0,
        // Heurística por defecto (usuario)
        evalWeights: {
          w_race: 2.0,
          w_clash: 1.0,
          w_sprint: 5.365895487831215,
          w_block: 13.542741590951847,
          done_bonus: 199.50580333275943,
          sprint_threshold: 2,
          w_chain: 1.9999991600001719,
          w_parity: 1.999999920000001,
          w_struct: 1.999999720000018,
          w_ones: 2.0,
          w_return: 1.99999996,
          w_waste: 2.0,
          w_mob: 2.0,
        },
      },
    },
    {
      id: 'iapowa_d10_imbatible',
      name: 'IAPowa D10 Imbatible',
      settings: {
        difficulty: 10,
        useWorkers: true,
        timeMode: 'manual',
        timeSeconds: 0,
        // Búsqueda máxima fuerza con poda segura
        enableTT: true,
        failSoft: true,
        preferHashMove: true,
        enablePVS: true,
        enableKillers: true,
        enableHistory: true,
        enableLMR: false,
        enableAdaptiveTime: false,
        forceFullDepth: true,
        // Poda selectiva
        enableLMP: false,
        lmpMaxDepth: 2,
        lmpBase: 6,
        enableFutility: false,
        futilityMargin: 150,
        enableIID: true,
        iidMinDepth: 3,
        // Quiescence más profunda para evitar horizonte
        enableQuiescence: true,
        quiescenceMaxPlies: 6,
        quiescenceStandPatMargin: 0,
        quiescenceSeeMargin: 0,
        quiescenceExtendOnRetire: true,
        quiescenceExtendOnJump: true,
        // LMR calibrado para precisión
        lmrMinDepth: 3,
        lmrLateMoveIdx: 5,
        lmrReduction: 1,
        // Orden determinista (sin jitter) y sin aleatoriedad de apertura
        orderingJitterEps: 0,
        randomOpeningPlies: 0,
        // Heurística por defecto (usuario)
        evalWeights: {
          w_race: 2.0,
          w_clash: 1.0,
          w_sprint: 5.365895487831215,
          w_block: 13.542741590951847,
          done_bonus: 199.50580333275943,
          sprint_threshold: 2,
          w_chain: 1.9999991600001719,
          w_parity: 1.999999920000001,
          w_struct: 1.999999720000018,
          w_ones: 2.0,
          w_return: 1.99999996,
          w_waste: 2.0,
          w_mob: 2.0,
        },
      },
    },
    {
      id: 'iapowa_perf',
      name: 'IAPowa+Rendimiento',
      settings: {
        difficulty: 4,
        useWorkers: true,
        timeMode: 'manual',
        timeSeconds: 5,
        // Heurística por defecto (usuario)
        evalWeights: {
          w_race: 2.0,
          w_clash: 1.0,
          w_sprint: 5.365895487831215,
          w_block: 13.542741590951847,
          done_bonus: 199.50580333275943,
          sprint_threshold: 2,
          w_chain: 1.9999991600001719,
          w_parity: 1.999999920000001,
          w_struct: 1.999999720000018,
          w_ones: 2.0,
          w_return: 1.99999996,
          w_waste: 2.0,
          w_mob: 2.0,
        },
      },
    },
    {
      id: 'iapowa_def',
      name: 'IAPowa+Defensa',
      settings: {
        difficulty: 5,
        useWorkers: true,
        timeMode: 'manual',
        timeSeconds: 30,
        // Heurística por defecto (usuario)
        evalWeights: {
          w_race: 2.0,
          w_clash: 1.0,
          w_sprint: 5.365895487831215,
          w_block: 13.542741590951847,
          done_bonus: 199.50580333275943,
          sprint_threshold: 2,
          w_chain: 1.9999991600001719,
          w_parity: 1.999999920000001,
          w_struct: 1.999999720000018,
          w_ones: 2.0,
          w_return: 1.99999996,
          w_waste: 2.0,
          w_mob: 2.0,
        },
      },
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
    // Migration: upgrade built-in presets with new defaults without clobbering user edits
    let changed = false;
    const def = getDefaultPresets();
    // Ensure any new default presets are present (e.g., 'iapowa_proof')
    for (const d of def) {
      if (!parsed.find(p => p.id === d.id)) { parsed.push(d); changed = true; }
    }
    const backfill = (id: string, forceDifficulty?: number) => {
      const d = def.find(p => p.id === id);
      const c = parsed.find(p => p.id === id);
      if (!d || !c) return;
      const cur = c.settings as any;
      const dft = d.settings as any;
      if (typeof forceDifficulty === 'number' && cur.difficulty !== forceDifficulty) {
        cur.difficulty = forceDifficulty; changed = true;
      }
      const keys = [
        'useWorkers','timeMode','timeSeconds',
        'enableTT','failSoft','preferHashMove','enablePVS','enableKillers','enableHistory','enableLMR',
        'enableLMP','lmpMaxDepth','lmpBase','enableFutility','futilityMargin',
        'enableIID','iidMinDepth',
        'enableQuiescence','quiescenceMaxPlies','quiescenceStandPatMargin','quiescenceSeeMargin','quiescenceExtendOnRetire','quiescenceExtendOnJump',
        'lmrMinDepth','lmrLateMoveIdx','lmrReduction',
        'orderingJitterEps','randomOpeningPlies'
      ];
      for (const k of keys) {
        if (cur[k] === undefined || cur[k] === null) { cur[k] = dft[k]; changed = true; }
      }
      const curW = (cur.evalWeights ||= {});
      const dftW = dft.evalWeights || {};
      const wKeys = ['w_race','w_clash','w_sprint','w_block','done_bonus','sprint_threshold','w_chain','w_parity','w_struct','w_ones','w_return','w_waste','w_mob'] as const;
      for (const wk of wKeys) {
        if (curW[wk] === undefined || curW[wk] === null) { curW[wk] = dftW[wk]; changed = true; }
      }
    };
    backfill('iapowa', 10);
    backfill('iapowa_perf', 4);
    backfill('iapowa_def', 5);
    if (changed) {
      try { localStorage.setItem(IA_PRESETS_KEY, JSON.stringify(parsed)); } catch {}
    }
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
