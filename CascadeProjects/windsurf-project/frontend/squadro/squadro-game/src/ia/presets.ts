// IA Presets for Squadro — persistence and defaults
// Mirrors the Soluna pattern but adapted to Squadro state shape

import type { AISpeed } from '../game/types';

export interface IAPreset {
  id: string;
  name: string;
  settings: {
    difficulty?: number; // 1..20
    useWorkers?: boolean;
    speed?: AISpeed;          // maps to timeSeconds via slice
    timeMode?: 'auto' | 'manual';
    timeSeconds?: number;     // when manual
  };
}

export const IA_PRESETS_KEY = 'squadro:ia:presets';
export const IA_SELECTED_KEY = 'squadro:ia:selected';

export function getDefaultPresets(): IAPreset[] {
  return [
    {
      id: 'iapowa',
      name: 'IAPowa',
      settings: { difficulty: 5, useWorkers: true, speed: 'normal', timeMode: 'manual', timeSeconds: 10 },
    },
    {
      id: 'iapowa_perf',
      name: 'IAPowa+Rendimiento',
      settings: { difficulty: 4, useWorkers: true, speed: 'rapido', timeMode: 'manual', timeSeconds: 5 },
    },
    {
      id: 'iapowa_def',
      name: 'IAPowa+Defensa',
      settings: { difficulty: 5, useWorkers: true, speed: 'lento', timeMode: 'manual', timeSeconds: 30 },
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
