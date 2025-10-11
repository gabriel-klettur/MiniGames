import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '../../../../../store/hooks';
import { applyIAPreset } from '../../../../../store/gameSlice';
import { loadPresets, savePresets, getDefaultPresets, getSelectedPresetId, setSelectedPresetId, type IAPreset } from '../../../../../ia/presets';
// Eval presets UI is not yet used in this tab; remove imports to avoid unused errors in strict builds
import Button from '../../../../ui/Button';

export default function PresetsTab() {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<IAPreset[]>(() => loadPresets());
  const [selectedId, setSelectedId] = useState<string>(() => getSelectedPresetId() || '');
  const [appliedId, setAppliedId] = useState<string>(() => getSelectedPresetId() || '');

  useEffect(() => {
    // Ensure defaults exist
    if (!items || items.length === 0) {
      const def = getDefaultPresets();
      setItems(def);
      setSelectedId((getSelectedPresetId() || def[0]?.id || ''));
      return;
    }
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);


  useEffect(() => {
    try { savePresets(items); } catch {}
    try { window.dispatchEvent(new Event('squadro:presets:update')); } catch {}
  }, [items]);


  const selected = useMemo(() => items.find(it => it.id === selectedId) || null, [items, selectedId]);
  

  const createPreset = () => {
    const id = `custom_${Date.now().toString(36)}`;
    const name = `Custom ${items.length + 1}`;
    setItems(prev => [...prev, { id, name, settings: { difficulty: 3, useWorkers: true, timeMode: 'manual', timeSeconds: 10 } }]);
    setSelectedId(id);
  };

  const duplicatePreset = () => {
    if (!selected) return;
    const id = `${selected.id}_copy_${Date.now().toString(36)}`;
    const name = `${selected.name} (copia)`;
    setItems(prev => [...prev, { id, name, settings: { ...selected.settings } }]);
    setSelectedId(id);
  };

  const deletePreset = () => {
    if (!selected) return;
    const next = items.filter(it => it.id !== selected.id);
    setItems(next);
    if (selected.id === appliedId) {
      try { setSelectedPresetId(''); } catch {}
      setAppliedId('');
    }
    if (next.length) setSelectedId(next[0].id); else setSelectedId('');
  };

  const renamePreset = (name: string) => {
    if (!selected) return;
    setItems(prev => prev.map(it => it.id === selected.id ? ({ ...it, name }) : it));
  };

  const setField = <K extends keyof IAPreset['settings']>(k: K, v: IAPreset['settings'][K]) => {
    if (!selected) return;
    setItems(prev => prev.map(it => {
      if (it.id !== selected.id) return it;
      const nextSettings = { ...it.settings, [k]: v } as IAPreset['settings'];
      // Normalize: if switching to auto, seconds must be 0 and we keep panel hidden
      if (k === 'timeMode' && v === 'auto') {
        nextSettings.timeSeconds = 0;
      }
      return { ...it, settings: nextSettings };
    }));
  };

  const applyCurrent = () => {
    if (!selected) return;
    dispatch(applyIAPreset({ ...selected.settings }));
    try { setSelectedPresetId(selected.id); } catch {}
    setAppliedId(selected.id);
    try { window.dispatchEvent(new Event('squadro:presets:update')); } catch {}
  };

  const restoreDefaults = () => {
    const def = getDefaultPresets();
    setItems(def);
    setSelectedId(def[0]?.id || '');
    try { window.dispatchEvent(new Event('squadro:presets:update')); } catch {}
  };

  // Heuristic presets CRUD functions were defined but not yet used in this tab UI.
  // To avoid build failures with noUnusedLocals, they were removed for now.
  // The underlying eval presets state persists; when the UI is added, reintroduce the handlers.

  // Small inline SVG icons (no external deps)
  const Icon = {
    Plus: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
    Copy: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1"><path d="M9 9h10v10H9z" stroke="currentColor" strokeWidth="2"/><path d="M5 5h10v10" stroke="currentColor" strokeWidth="2"/></svg>),
    Trash: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1"><path d="M9 7h6m-7 3h8l-1 9H9l-1-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>),
    Check: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    Reset: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1"><path d="M4 4v6h6" stroke="currentColor" strokeWidth="2"/><path d="M20 20a8 8 0 1 1-5.657-13.657L16 8" stroke="currentColor" strokeWidth="2"/></svg>),
  } as const;

  return (
    <div className="presets-tab flex gap-3">
      <div className="presets-list min-w-[260px] border-r border-neutral-800 pr-3">
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="neutral" onClick={createPreset} title="Crear un nuevo preset vacío"><Icon.Plus />Nuevo</Button>
          <Button size="sm" variant="neutral" onClick={duplicatePreset} disabled={!selected} title="Duplicar el preset seleccionado"><Icon.Copy />Duplicar</Button>
          <Button size="sm" variant="danger" onClick={deletePreset} disabled={!selected} title="Eliminar el preset seleccionado"><Icon.Trash />Eliminar</Button>
        </div>
        <ul className="list-none m-0 p-0 flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
          {items.map(it => (
            <li key={it.id}>
              <Button
                size="sm"
                variant={selectedId === it.id ? 'primary' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedId(it.id)}
                aria-current={selectedId === it.id}
                title="Seleccionar preset"
              >
                <span className="inline-block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">{it.name}</span>
                {appliedId === it.id && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-emerald-700/30 text-emerald-300 border border-emerald-600/40 align-middle">actual</span>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="preset-editor flex-1 flex flex-col gap-3">
        {!selected && <div className="kpi kpi--muted">Selecciona un preset o crea uno nuevo.</div>}
        {selected && (
          <>
            <div className="flex items-center gap-2">
              <label title="Nombre del preset — Etiqueta visible en listas y menús. Ejemplo: 'IAPowa+Rendimiento' para indicar foco en velocidad." className="text-xs text-neutral-300 inline-flex items-center gap-2">
                Nombre
                <input type="text" value={selected.name} onChange={(e) => renamePreset(e.target.value)} className="ml-1 w-72 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
              </label>
              <div className="ml-auto inline-flex gap-2">
                <Button size="sm" variant="primary" onClick={applyCurrent} title="Aplicar — Copia los ajustes del preset al estado de IA actual (jugador activo). Ejemplo: cambia profundidad/tiempo y toggles sin afectar otros presets."><Icon.Check />Aplicar</Button>
                <Button size="sm" variant="outline" onClick={restoreDefaults} title="Restaurar por defecto — Restaura el conjunto de presets iniciales (IAPowa, IAPowa+Rendimiento, etc.). Útil si se borraron o modificaron accidentalmente."><Icon.Reset />Restaurar por defecto</Button>
              </div>
            </div>

            <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 min-w-[300px]">
              <h4 className="text-xs font-semibold text-neutral-300 m-0 mb-2">Ajustes</h4>
              <div className="flex gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Dificultad — Mapea a profundidad objetivo por defecto en modos manuales. Ejemplo: dificultad=5 ⇒ profundidad=5 si no se sobreescribe desde la UI.">
                  Dificultad
                  <input type="number" min={1} max={20} step={1} value={selected.settings.difficulty ?? 3} onChange={(e) => setField('difficulty', Math.max(1, Math.min(20, Number(e.target.value))))} className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Workers — Ejecuta la IA en Web Workers para no bloquear la UI. Ejemplo: ON en dispositivos multi‑núcleo para paralelizar raíz; OFF si se depura en hilo principal.">
                  Workers
                  <input type="checkbox" checked={!!selected.settings.useWorkers} onChange={(e) => setField('useWorkers', e.target.checked)} />
                </label>
                
                <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Modo tiempo — Manual: fija segundos por jugada. Auto: delega en heurísticas/adaptativo. Ejemplo: Manual=10s asegura timebox; Auto usa profundidad/ventanas para decidir stop.">
                  Modo tiempo
                  <select value={selected.settings.timeMode || 'manual'} onChange={(e) => setField('timeMode', e.target.value as any)} className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                    <option value="manual">manual</option>
                    <option value="auto">auto</option>
                  </select>
                </label>
                {selected.settings.timeMode !== 'auto' && (
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Segundos por jugada (Manual) — Límite duro por movimiento. Ejemplo: 5s fuerza decisiones más rápidas; 30s permite explorar más profundo.">
                    Segundos
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={1}
                      value={selected.settings.timeSeconds ?? 10}
                      onChange={(e) => setField('timeSeconds', Math.max(0, Math.min(60, Number(e.target.value))))}
                      className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
                    />
                  </label>
                )}
              </div>
            </div>

            

            {/* Motor: toggles y LMR */}
            <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 min-w-[300px]">
              <h4 className="text-xs font-semibold text-neutral-300 m-0 mb-2">Motor • Búsqueda base</h4>
              <div className="flex gap-3 flex-wrap mb-2">
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={selected.settings.enableTT !== false} onChange={(e) => setField('enableTT', e.target.checked)} /> TT</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!selected.settings.failSoft} onChange={(e) => setField('failSoft', e.target.checked)} /> Fail-soft</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!selected.settings.preferHashMove} onChange={(e) => setField('preferHashMove', e.target.checked)} /> Hash move</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={selected.settings.enablePVS !== false} onChange={(e) => setField('enablePVS', e.target.checked)} /> PVS</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={selected.settings.enableKillers !== false} onChange={(e) => setField('enableKillers', e.target.checked)} /> Killers</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={selected.settings.enableHistory !== false} onChange={(e) => setField('enableHistory', e.target.checked)} /> History</label>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={selected.settings.enableLMR !== false} onChange={(e) => setField('enableLMR', e.target.checked)} /> Enable LMR</label>
                <label className="text-xs inline-flex items-center gap-2" title="Quiescence — Extiende hojas tácticas (p. ej., capturas o swings) unos plies adicionales para estabilizar la evaluación y mitigar el 'horizon effect'. Recomendada ON con qPlies moderado (3–5)."><input type="checkbox" checked={!!selected.settings.enableQuiescence} onChange={(e) => setField('enableQuiescence', e.target.checked)} /> Quiescence</label>
                <label className="text-xs inline-flex items-center gap-2" title="orderingJitterEps — Ruido leve en la prioridad del orden para romper empates deterministas. 0 desactiva; sugerido 0.5–2.0.">
                  jitter
                  <input type="number" step={0.1} className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={selected.settings.orderingJitterEps ?? 0} onChange={(e) => setField('orderingJitterEps', Number(e.target.value))} />
                </label>
              </div>
              <h4 className="text-xs font-semibold text-neutral-300 m-0 mb-2">LMR</h4>
              <div className="flex gap-3 flex-wrap">
                <label className="text-xs text-neutral-300 inline-flex items-center gap-2">minDepth
                  <input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={selected.settings.lmrMinDepth ?? 3} onChange={(e) => setField('lmrMinDepth', Number(e.target.value))} />
                </label>
                <label className="text-xs text-neutral-300 inline-flex items-center gap-2">lateIdx
                  <input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={selected.settings.lmrLateMoveIdx ?? 3} onChange={(e) => setField('lmrLateMoveIdx', Number(e.target.value))} />
                </label>
                <label className="text-xs text-neutral-300 inline-flex items-center gap-2">reduction
                  <input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={selected.settings.lmrReduction ?? 1} onChange={(e) => setField('lmrReduction', Number(e.target.value))} />
                </label>
                <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="qPlies — Límite de extensiones de Quiescence.">qPlies
                  <input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={selected.settings.quiescenceMaxPlies ?? 4} onChange={(e) => setField('quiescenceMaxPlies', Number(e.target.value))} />
                </label>
              </div>
            </div>

            {/* Heurística Global */}
            <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 min-w-[300px]">
              <h4 className="text-xs font-semibold text-neutral-300 m-0 mb-2">Heurística (global)</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {(['w_race','w_clash','w_sprint','w_block'] as const).map((k) => (
                  <label key={k} className="text-xs text-neutral-300 inline-flex items-center gap-2">
                    {k}
                    <input
                      type="number"
                      step={0.1}
                      className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                      value={(selected.settings.evalWeights as any)?.[k] ?? ''}
                      onChange={(e) => setField('evalWeights', { ...(selected.settings.evalWeights || {}), [k]: Number(e.target.value) } as any)}
                    />
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {(['done_bonus','sprint_threshold','tempo'] as const).map((k) => (
                  <label key={k} className="text-xs text-neutral-300 inline-flex items-center gap-2">
                    {k}
                    <input
                      type="number"
                      step={k === 'done_bonus' ? 0.5 : 1}
                      className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                      value={(selected.settings.evalWeights as any)?.[k] ?? ''}
                      onChange={(e) => setField('evalWeights', { ...(selected.settings.evalWeights || {}), [k]: Number(e.target.value) } as any)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
