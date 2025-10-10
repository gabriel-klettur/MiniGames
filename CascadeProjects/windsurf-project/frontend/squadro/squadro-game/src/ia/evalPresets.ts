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
    w_race: 1.0,
    w_clash: 0.8,
    w_sprint: 0.6,
    w_block: 0.3,
    done_bonus: 5.0,
    sprint_threshold: 2,
    tempo: 5,
  };
  return [
    { id: 'balanced', name: 'Balanced', weights: { ...base } },
    { id: 'aggressive', name: 'Aggressive (jumps)', weights: { ...base, w_clash: 1.2, w_block: 0.2 } },
    { id: 'closer', name: 'Closer (finish)', weights: { ...base, w_sprint: 0.9, done_bonus: 7 } },
  ];
}

export function loadEvalPresets(): EvalPreset[] {
  try {
    const raw = localStorage.getItem(EVAL_PRESETS_KEY);
    if (!raw) {
      const def = getDefaultEvalPresets();
      localStorage.setItem(EVAL_PRESETS_KEY, JSON.stringify(def));
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
