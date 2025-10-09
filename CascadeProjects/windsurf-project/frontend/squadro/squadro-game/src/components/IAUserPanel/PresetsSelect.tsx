import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { applyIAPreset } from '../../store/gameSlice';
import { loadPresets, getSelectedPresetId, setSelectedPresetId, type IAPreset } from '../../ia/presets';

interface PresetsSelectProps {
  className?: string;
}

/**
 * PresetsSelect — Selector de presets IA (patrón Soluna) para Squadro.
 * - Persiste en localStorage con claves 'squadro:ia:presets' y 'squadro:ia:selected'.
 * - Al cambiar, aplica el preset vía Redux (applyIAPreset).
 */
export default function PresetsSelect({ className }: PresetsSelectProps) {
  const dispatch = useAppDispatch();
  const presets = useMemo<IAPreset[]>(() => loadPresets(), []);
  const [selected, setSelected] = useState<string | ''>(() => getSelectedPresetId() || '');

  // Keep a stable map for quick lookup
  const byId = useMemo(() => new Map(presets.map((p) => [p.id, p])), [presets]);

  useEffect(() => {
    // If a selected id exists on mount, do not auto-apply to avoid surprise.
    // The selection reflects storage; user action triggers application.
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    setSelectedPresetId(id);
    const p = byId.get(id);
    if (p) {
      dispatch(applyIAPreset(p.settings));
    }
  };

  return (
    <label className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="sr-only">Preset IA</span>
      <select aria-label="Seleccionar preset de IA" value={selected} onChange={handleChange}>
        <option value="">Preset…</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}
