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
    // Escala del documento: 100 pts ≈ 1 tempo, done=200, clash=50
    w_race: 1.0,
    w_clash: 50.0,
    w_sprint: 8.0,
    w_block: 10.0,
    // Multiplicadores para completar los 12 puntos (1.0 por defecto)
    w_chain: 1.0,
    w_parity: 1.0,
    w_struct: 1.0,
    w_ones: 1.0,
    w_return: 1.0,
    w_waste: 1.0,
    w_mob: 1.0,
    done_bonus: 200.0,
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
