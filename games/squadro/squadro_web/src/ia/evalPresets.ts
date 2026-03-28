import type { EvalParams } from './evalTypes';

export interface EvalPreset {
  id: string;
  name: string;
  weights: EvalParams;
}

export const EVAL_PRESETS_KEY = 'squadro:ia:eval-presets';
export const EVAL_SELECTED_KEY = 'squadro:ia:eval-selected';

export function getDefaultEvalPresets(): EvalPreset[] {
  const base: EvalParams = {
    // Balanced (user default): calibrado desde experimento Deep3v3_100_82vs18
    w_race: 2.0,
    w_clash: 29.978015521361044,
    w_sprint: 5.365895487831215,
    w_block: 13.542741590951847,
    // Multiplicadores extendidos (12 señales)
    w_chain: 1.9999991600001719,
    w_parity: 1.999999920000001,
    w_struct: 1.999999720000018,
    w_ones: 2.0,
    w_return: 1.99999996,
    w_waste: 2.0,
    w_mob: 2.0,
    done_bonus: 199.50580333275943,
    sprint_threshold: 2,
  };
  return [
    { id: 'balanced', name: 'Balanced', weights: { ...base } },
    { id: 'aggressive', name: 'Aggressive (jumps)', weights: { ...base, w_clash: 75.0, w_block: 8.0 } },
    { id: 'closer', name: 'Closer (finish)', weights: { ...base, w_sprint: 12.0, done_bonus: 220.0 } },
  ];
}

export function loadEvalPresets(): EvalPreset[] {
  try {
    const raw = localStorage.getItem(EVAL_PRESETS_KEY);
    if (!raw) {
      const def = getDefaultEvalPresets();
      localStorage.setItem(EVAL_PRESETS_KEY, JSON.stringify(def));
      // If no selection yet, select Balanced by default
      try {
        const sel = localStorage.getItem(EVAL_SELECTED_KEY);
        if (!sel) localStorage.setItem(EVAL_SELECTED_KEY, 'balanced');
      } catch {}
      return def;
    }
    const parsed = JSON.parse(raw) as EvalPreset[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('invalid eval presets');
    return parsed;
  } catch {
    const def = getDefaultEvalPresets();
    try { localStorage.setItem(EVAL_PRESETS_KEY, JSON.stringify(def)); } catch {}
    return def;
  }
}

export function saveEvalPresets(presets: EvalPreset[]): void {
  localStorage.setItem(EVAL_PRESETS_KEY, JSON.stringify(presets));
}

export function getSelectedEvalPresetId(): string | null {
  try { return localStorage.getItem(EVAL_SELECTED_KEY); } catch { return null; }
}

export function setSelectedEvalPresetId(id: string): void {
  try { localStorage.setItem(EVAL_SELECTED_KEY, id); } catch {}
}

export function findEvalPresetById(id: string, inList?: EvalPreset[]): EvalPreset | null {
  const list = inList ?? loadEvalPresets();
  return list.find(p => p.id === id) ?? null;
}
