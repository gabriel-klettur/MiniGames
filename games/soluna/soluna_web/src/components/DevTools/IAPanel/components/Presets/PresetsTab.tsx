import { useEffect, useMemo, useState } from 'react';
import type { SearchOptions } from '../../../../../ia/search/types';
import { defaultOptions, IAPOWA_PRESET, IAPOWA_PERFORMANCE_PRESET, IAPOWA_DEFENSE_PRESET } from '../../../../../ia/search/options';

export interface PresetsTabProps {
  onApplyPresetCustom?: (options: SearchOptions, scope?: 'current' | 'both') => void;
  onChangePresets?: (items: Array<{ id: string; name: string; options: SearchOptions }>) => void;
  initialItems?: Array<{ id: string; name: string; options: SearchOptions }>;
}

type PresetItem = {
  id: string;
  name: string;
  options: SearchOptions;
};

const LS_KEY = 'soluna:ia:presets';

function makeDefaultPresets(): PresetItem[] {
  return [
    { id: 'iapowa', name: 'IAPowa', options: { ...IAPOWA_PRESET } },
    { id: 'iapowa_perf', name: 'IAPowa+Rendimiento', options: { ...IAPOWA_PERFORMANCE_PRESET } },
    { id: 'iapowa_def', name: 'IAPowa+Defensa', options: { ...IAPOWA_DEFENSE_PRESET } },
  ];
}

const boolField = (label: string, key: keyof SearchOptions, value: any, onChange: (k: keyof SearchOptions, v: boolean) => void, title?: string) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={title || ''}>
    <input type="checkbox" checked={!!value} onChange={(e) => onChange(key, e.target.checked)} /> {label}
  </label>
);

const numField = (label: string, key: keyof SearchOptions, value: any, onChange: (k: keyof SearchOptions, v: number) => void, title?: string, width = 80, step = 1, min?: number) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={title || ''}>
    {label}
    <input
      type="number"
      step={step}
      value={typeof value === 'number' ? value : ''}
      onChange={(e) => onChange(key, Number(e.target.value))}
      style={{ width }}
      min={min}
    />
  </label>
);

export default function PresetsTab(props: PresetsTabProps) {
  const { onApplyPresetCustom, onChangePresets, initialItems } = props;
  const [items, setItems] = useState<PresetItem[]>(() => {
    if (initialItems && initialItems.length) return initialItems as PresetItem[];
    return [];
  });
  const [selectedId, setSelectedId] = useState<string>('');

  // load from localStorage
  useEffect(() => {
    if (items.length > 0) return; // if already initialized (from initialItems), skip LS
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: PresetItem[] = JSON.parse(raw);
        setItems(parsed);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
        return;
      }
    } catch {}
    const def = makeDefaultPresets();
    setItems(def);
    setSelectedId(def[0].id);
  }, [items.length]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
    try { onChangePresets && onChangePresets(items as Array<{ id: string; name: string; options: SearchOptions }>); } catch {}
  }, [items, onChangePresets]);

  const selected = useMemo(() => items.find(it => it.id === selectedId) || null, [items, selectedId]);

  const mutateSelected = (patch: Partial<SearchOptions>) => {
    if (!selected) return;
    setItems(prev => prev.map(it => it.id === selected.id ? ({ ...it, options: { ...it.options, ...patch } }) : it));
  };

  const setField = (k: keyof SearchOptions, v: any) => mutateSelected({ [k]: v } as any);

  const createPreset = () => {
    const id = `custom_${Date.now().toString(36)}`;
    const name = `Custom ${items.length + 1}`;
    setItems(prev => [...prev, { id, name, options: { ...defaultOptions } }]);
    setSelectedId(id);
  };

  const duplicatePreset = () => {
    if (!selected) return;
    const id = `${selected.id}_copy_${Date.now().toString(36)}`;
    const name = `${selected.name} (copia)`;
    setItems(prev => [...prev, { id, name, options: { ...selected.options } }]);
    setSelectedId(id);
  };

  const deletePreset = () => {
    if (!selected) return;
    const next = items.filter(it => it.id !== selected.id);
    setItems(next);
    if (next.length) setSelectedId(next[0].id); else setSelectedId('');
  };

  const renamePreset = (name: string) => {
    if (!selected) return;
    setItems(prev => prev.map(it => it.id === selected.id ? ({ ...it, name }) : it));
  };

  const applyCurrent = (scope: 'current' | 'both') => {
    if (!selected || !onApplyPresetCustom) return;
    onApplyPresetCustom(selected.options, scope);
  };

  return (
    <div className="presets-tab" style={{ display: 'flex', gap: 12 }}>
      {/* Listado de presets */}
      <div className="presets-list" style={{ minWidth: 260, borderRight: '1px solid #30363d', paddingRight: 12 }}>
        <div className="row" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button onClick={createPreset} title="Crear un nuevo preset vacío">Nuevo</button>
          <button onClick={duplicatePreset} disabled={!selected} title="Duplicar el preset seleccionado">Duplicar</button>
          <button onClick={deletePreset} disabled={!selected} title="Eliminar el preset seleccionado">Eliminar</button>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(it => (
            <li key={it.id}>
              <button
                className={selectedId === it.id ? 'active' : ''}
                onClick={() => setSelectedId(it.id)}
                style={{ width: '100%', textAlign: 'left' }}
                title="Seleccionar preset"
              >{it.name}</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor del preset seleccionado */}
      <div className="preset-editor" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!selected && (
          <div className="kpi kpi--muted">Selecciona un preset o crea uno nuevo.</div>
        )}
        {selected && (
          <>
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label title="Nombre del preset">
                Nombre
                <input type="text" value={selected.name} onChange={(e) => renamePreset(e.target.value)} style={{ marginLeft: 6, width: 280 }} />
              </label>
              <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
                <button onClick={() => applyCurrent('current')} title="Aplicar al jugador actualmente seleccionado en el panel">Aplicar al actual</button>
                <button onClick={() => applyCurrent('both')} title="Aplicar a ambos jugadores">Aplicar a ambos</button>
              </div>
            </div>

            {/* Búsqueda base */}
            <div className="panel small" style={{ minWidth: 300 }}>
              <h4 style={{ marginTop: 0 }}>Búsqueda base</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {boolField('TT', 'enableTT', selected.options.enableTT, setField, 'Tabla de Transposiciones')}
                {boolField('Fail-soft', 'failSoft', selected.options.failSoft, setField)}
                {boolField('Hash move', 'preferHashMove', selected.options.preferHashMove, setField)}
                {boolField('PVS', 'enablePVS', selected.options.enablePVS, setField)}
                {boolField('Killers', 'enableKillers', selected.options.enableKillers, setField)}
                {boolField('History', 'enableHistory', selected.options.enableHistory, setField)}
              </div>
            </div>

            {/* Ventanas y Quiescence */}
            <div className="panel small" style={{ minWidth: 300 }}>
              <h4 style={{ marginTop: 0 }}>Ventanas</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {boolField('Aspiration', 'enableAspiration', selected.options.enableAspiration, setField)}
                {numField('Δ', 'aspirationDelta', selected.options.aspirationDelta, setField, 'Margen de aspiración', 72, 1, 1)}
              </div>
            </div>

            <div className="panel small" style={{ minWidth: 300 }}>
              <h4 style={{ marginTop: 0 }}>Quiescence</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {boolField('Quiescence', 'enableQuiescence', selected.options.enableQuiescence, setField)}
                {numField('profundidad', 'quiescenceDepth', selected.options.quiescenceDepth, setField, 'qDepth', 72)}
                {numField('torre≥', 'quiescenceHighTowerThreshold', selected.options.quiescenceHighTowerThreshold, setField, 'Umbral de torre alta', 72)}
              </div>
            </div>

            {/* Reducciones y pruning */}
            <div className="panel small" style={{ minWidth: 300 }}>
              <h4 style={{ marginTop: 0 }}>Reducciones y pruning</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {boolField('LMR', 'enableLMR', selected.options.enableLMR, setField)}
                {numField('minDepth', 'lmrMinDepth', selected.options.lmrMinDepth, setField, undefined, 72)}
                {numField('lateIdx', 'lmrLateMoveIdx', selected.options.lmrLateMoveIdx, setField, undefined, 72)}
                {numField('reduction', 'lmrReduction', selected.options.lmrReduction, setField, undefined, 72)}
                {boolField('Futility', 'enableFutility', selected.options.enableFutility, setField)}
                {numField('margin', 'futilityMargin', selected.options.futilityMargin, setField, undefined, 72)}
                {boolField('LMP', 'enableLMP', selected.options.enableLMP, setField)}
                {numField('depth≤', 'lmpDepthThreshold', selected.options.lmpDepthThreshold, setField, undefined, 72)}
                {numField('lateIdx', 'lmpLateMoveIdx', selected.options.lmpLateMoveIdx, setField, undefined, 72)}
              </div>
            </div>

            {/* Null-move */}
            <div className="panel small" style={{ minWidth: 300 }}>
              <h4 style={{ marginTop: 0 }}>Null-move</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {boolField('Null-move', 'enableNullMove', selected.options.enableNullMove, setField)}
                {numField('reduction', 'nullMoveReduction', selected.options.nullMoveReduction, setField, undefined, 72)}
                {numField('minDepth', 'nullMoveMinDepth', selected.options.nullMoveMinDepth, setField, undefined, 72)}
              </div>
            </div>

            <div className="row" style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setItems(items => items.slice())} title="Guardar cambios (persisten automáticamente)">Guardar</button>
              <button onClick={() => {
                const def = makeDefaultPresets();
                setItems(def);
                setSelectedId(def[0].id);
              }} title="Restaurar presets por defecto">Restaurar por defecto</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
