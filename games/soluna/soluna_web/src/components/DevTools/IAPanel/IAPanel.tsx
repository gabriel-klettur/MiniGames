import { useState, useEffect } from 'react';
import type { IAPanelProps, TabKey } from './types';
import ControlSection from './components/ControlSection';
import AnalysisSection from './components/AnalysisSection';
import TimeAdvancedSettings from './components/Advanced/TimeAdvancedSettings';
import SearchSettings from './components/Advanced/SearchSettings';
import WindowsSettings from './components/Advanced/WindowsSettings';
import QuiescenceSettings from './components/Advanced/QuiescenceSettings';
import PresetsTab from './components/Presets/PresetsTab';
import { IAPOWA_PRESET, IAPOWA_PERFORMANCE_PRESET, IAPOWA_DEFENSE_PRESET } from '../../../ia/search/options';
import type { SearchOptions } from '../../../ia/search/types';

 
export default function IAPanel(props: IAPanelProps) {
  const { state, depth, onChangeDepth, onAIMove, disabled, timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds, busy = false, progress = null,
    evalScore = null, depthReached = null, pv = [], rootMoves = [], nodes = 0, elapsedMs = 0, nps = 0, rootPlayer, moving = false,
    aiPresetIAPowaSelected, onChangeAiPresetIAPowaSelected,
    aiEnableTT, onToggleAiEnableTT,
    aiFailSoft, onToggleAiFailSoft,
    aiPreferHashMove, onToggleAiPreferHashMove,
    aiEnablePVS, onToggleAiEnablePVS,
    aiEnableAspiration, onToggleAiEnableAspiration, aiAspirationDelta, onChangeAiAspirationDelta,
    aiEnableKillers, onToggleAiEnableKillers,
    aiEnableHistory, onToggleAiEnableHistory,
    aiEnableQuiescence, onToggleAiEnableQuiescence, aiQuiescenceDepth, onChangeAiQuiescenceDepth,
    aiQuiescenceHighTowerThreshold, onChangeAiQuiescenceHighTowerThreshold,
    aiTimeMinMs, onChangeAiTimeMinMs,
    aiTimeMaxMs, onChangeAiTimeMaxMs,
    aiTimeBaseMs, onChangeAiTimeBaseMs,
    aiTimePerMoveMs, onChangeAiTimePerMoveMs,
    aiTimeExponent, onChangeAiTimeExponent,
    aiEditTarget = 1, onChangeAiEditTarget,
    onApplyPresetIAPowaCurrent,
    onApplyPresetIAPowaBoth,
    aiApplyPresetCustom,
  } = props;

  const current = state.currentPlayer === 1 ? 'Jugador 1' : 'Jugador 2';
  const atRootLabel = rootPlayer ? (rootPlayer === 1 ? 'Jugador 1' : 'Jugador 2') : current;

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<TabKey>('control');
  // Presets compartidos con el tab "Presets" (persistidos en localStorage)
  const LS_KEY = 'soluna:ia:presets';
  type PresetItem = { id: string; name: string; options: SearchOptions };
  const defaultPresetItems: PresetItem[] = [
    { id: 'iapowa', name: 'IAPowa', options: { ...IAPOWA_PRESET } },
    { id: 'iapowa_perf', name: 'IAPowa+Rendimiento', options: { ...IAPOWA_PERFORMANCE_PRESET } },
    { id: 'iapowa_def', name: 'IAPowa+Defensa', options: { ...IAPOWA_DEFENSE_PRESET } },
  ];
  const [presetItems, setPresetItems] = useState<PresetItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as PresetItem[];
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {}
    try { localStorage.setItem(LS_KEY, JSON.stringify(defaultPresetItems)); } catch {}
    return defaultPresetItems;
  });
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('');

  // Ensure defaults exist (restore if faltan o está vacío)
  useEffect(() => {
    const required = new Set(['iapowa', 'iapowa_perf', 'iapowa_def']);
    const missing: string[] = [];
    required.forEach(id => { if (!presetItems.some(p => p.id === id)) missing.push(id); });
    if (presetItems.length === 0 || missing.length > 0) {
      const merged: PresetItem[] = [...presetItems];
      defaultPresetItems.forEach(p => { if (!merged.some(m => m.id === p.id)) merged.push(p); });
      setPresetItems(merged);
      try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch {}
      try { window.dispatchEvent(new CustomEvent('soluna:presets:update')); } catch {}
    }
  }, []);

  return (
    <section className="panel ia-panel" aria-label="Panel de IA" style={{ width: '100%', maxWidth: 'none', flex: '1 1 auto' }}>
      {/* Encabezado */}
      <div className="ia-panel__header">        
        <div className="ia-panel__status">
          {moving && <span className="kpi kpi--accent" aria-live="polite">Moviendo</span>}
          {busy && !moving && <span className="kpi">Pensando…{progress ? ` d${progress.depth}` : ''}</span>}
          {!busy && !moving && <span className="kpi kpi--muted">En espera</span>}
        </div>
      </div>

      {/* Tabs: Control / Análisis */}
      <div className="ia__tabs segmented" role="tablist" aria-label="Secciones del Panel de IA" style={{ marginTop: 8 }}>
        <button
          className={activeTab === 'control' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'control'}
          onClick={() => setActiveTab('control')}
          title="Controles y acciones de cálculo"
        >
          Control
        </button>
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
          title="Evaluación, PV, métricas y top jugadas"
        >
          Análisis
        </button>
        <button
          className={activeTab === 'advanced' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'advanced'}
          onClick={() => setActiveTab('advanced')}
          title="Configuración avanzada: tiempo (auto), búsqueda base, ventanas, quiescence y presets"
        >
          Avanzado
        </button>
        <button
          className={activeTab === 'presets' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'presets'}
          onClick={() => setActiveTab('presets')}
          title="Crear, editar, duplicar, borrar y aplicar presets de IA"
        >
          Presets
        </button>
      </div>

      {/* Tab: Control */}
      {activeTab === 'control' && (
        <>
          {/* Preset selector (estilo InfoIA) — usa la misma lista que el tab "Presets" */}
          <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <label title={'Selecciona y aplica un preset al jugador actual.'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="kpi">Preset</span>
              <select
                value={selectedPresetKey}
                onChange={(e) => {
                  const key = e.target.value;
                  setSelectedPresetKey(key);
                  const opt = presetItems.find((o: PresetItem) => o.id === key);
                  if (opt && aiApplyPresetCustom) aiApplyPresetCustom({ ...opt.options }, 'current');
                }}
                aria-label="Preset de IA por jugador"
              >
                <option value="">(ninguno)</option>
                {presetItems.map((opt: PresetItem) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <button
              disabled={!selectedPresetKey}
              onClick={() => {
                const opt = presetItems.find((o: PresetItem) => o.id === selectedPresetKey);
                if (opt && aiApplyPresetCustom) aiApplyPresetCustom({ ...opt.options }, 'both');
              }}
              title="Aplicar el preset seleccionado a ambos jugadores"
            >Aplicar a ambos</button>
          </div>
          {(typeof aiEditTarget === 'number' && typeof onChangeAiEditTarget === 'function') && (
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="kpi kpi--muted" title="Selecciona a qué jugador se aplican los toggles de motor del panel (TT, PVS, etc.).">Editando</span>
              <div className="segmented" role="tablist" aria-label="Jugador a editar">
                <button
                  className={aiEditTarget === 1 ? 'active' : ''}
                  role="tab"
                  aria-selected={aiEditTarget === 1}
                  onClick={() => onChangeAiEditTarget(1)}
                  title="Editar opciones del Jugador 1"
                >J1</button>
                <button
                  className={aiEditTarget === 2 ? 'active' : ''}
                  role="tab"
                  aria-selected={aiEditTarget === 2}
                  onClick={() => onChangeAiEditTarget(2)}
                  title="Editar opciones del Jugador 2"
                >J2</button>
              </div>
            </div>
          )}
          {/* Presets */}
          {(onApplyPresetIAPowaCurrent || onApplyPresetIAPowaBoth) && (
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="kpi" title="Cargar configuración estable para IA">Presets</span>
              {onApplyPresetIAPowaCurrent && (
                <button onClick={onApplyPresetIAPowaCurrent} title="Aplicar IAPowa al jugador seleccionado">IAPowa (actual)</button>
              )}
              {onApplyPresetIAPowaBoth && (
                <button onClick={onApplyPresetIAPowaBoth} title="Aplicar IAPowa a ambos jugadores">IAPowa (ambos)</button>
              )}
            </div>
          )}
          <ControlSection
          depth={depth}
          onChangeDepth={onChangeDepth}
          timeMode={timeMode}
          timeSeconds={timeSeconds}
          onChangeTimeMode={onChangeTimeMode}
          onChangeTimeSeconds={onChangeTimeSeconds}
          busy={busy}
          progress={progress}
          disabled={disabled}
          onAIMove={onAIMove}
          elapsedMs={elapsedMs}
          busyElapsedMs={props.busyElapsedMs}
          showEngine={false}
          showAutoTimeAdvanced={false}
          aiPresetIAPowaSelected={aiPresetIAPowaSelected}
          onChangeAiPresetIAPowaSelected={onChangeAiPresetIAPowaSelected}
          aiEnableTT={aiEnableTT}
          onToggleAiEnableTT={onToggleAiEnableTT}
          aiFailSoft={aiFailSoft}
          onToggleAiFailSoft={onToggleAiFailSoft}
          aiPreferHashMove={aiPreferHashMove}
          onToggleAiPreferHashMove={onToggleAiPreferHashMove}
          aiEnablePVS={aiEnablePVS}
          onToggleAiEnablePVS={onToggleAiEnablePVS}
          aiEnableAspiration={aiEnableAspiration}
          onToggleAiEnableAspiration={onToggleAiEnableAspiration}
          aiAspirationDelta={aiAspirationDelta}
          onChangeAiAspirationDelta={onChangeAiAspirationDelta}
          aiEnableKillers={aiEnableKillers}
          onToggleAiEnableKillers={onToggleAiEnableKillers}
          aiEnableHistory={aiEnableHistory}
          onToggleAiEnableHistory={onToggleAiEnableHistory}
          aiEnableQuiescence={aiEnableQuiescence}
          onToggleAiEnableQuiescence={onToggleAiEnableQuiescence}
          aiQuiescenceDepth={aiQuiescenceDepth}
          onChangeAiQuiescenceDepth={onChangeAiQuiescenceDepth}
          aiQuiescenceHighTowerThreshold={aiQuiescenceHighTowerThreshold}
          onChangeAiQuiescenceHighTowerThreshold={onChangeAiQuiescenceHighTowerThreshold}
          aiTimeMinMs={aiTimeMinMs}
          onChangeAiTimeMinMs={onChangeAiTimeMinMs}
          aiTimeMaxMs={aiTimeMaxMs}
          onChangeAiTimeMaxMs={onChangeAiTimeMaxMs}
          aiTimeBaseMs={aiTimeBaseMs}
          onChangeAiTimeBaseMs={onChangeAiTimeBaseMs}
          aiTimePerMoveMs={aiTimePerMoveMs}
          onChangeAiTimePerMoveMs={onChangeAiTimePerMoveMs}
          aiTimeExponent={aiTimeExponent}
          onChangeAiTimeExponent={onChangeAiTimeExponent}
        />
        </>
      )}

      {/* Tab: Análisis */}
      {activeTab === 'analysis' && (
        <AnalysisSection
          state={state}
          evalScore={evalScore}
          depthReached={depthReached}
          pv={pv}
          nodes={nodes}
          elapsedMs={elapsedMs}
          nps={nps}
          atRootLabel={atRootLabel}
          currentLabel={current}
          rootMoves={rootMoves}
        />
      )}

      {/* Tab: Avanzado */}
      {activeTab === 'advanced' && (
        <div className="ia-panel__advanced" style={{ marginTop: 8 }}>
          <div className="row" style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
            {/* Tiempo (auto) */}
            <TimeAdvancedSettings
              timeMode={timeMode}
              aiTimeMinMs={aiTimeMinMs}
              onChangeAiTimeMinMs={onChangeAiTimeMinMs}
              aiTimeMaxMs={aiTimeMaxMs}
              onChangeAiTimeMaxMs={onChangeAiTimeMaxMs}
              aiTimeBaseMs={aiTimeBaseMs}
              onChangeAiTimeBaseMs={onChangeAiTimeBaseMs}
              aiTimePerMoveMs={aiTimePerMoveMs}
              onChangeAiTimePerMoveMs={onChangeAiTimePerMoveMs}
              aiTimeExponent={aiTimeExponent}
              onChangeAiTimeExponent={onChangeAiTimeExponent}
            />

            {/* Presets */}
            {(onApplyPresetIAPowaCurrent || onApplyPresetIAPowaBoth) && (
              <div className="panel small" style={{ minWidth: 300 }}>
                <h4 style={{ marginTop: 0 }}>Presets</h4>
                <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Marca si el jugador editado coincide con el preset IAPowa; se desmarca al editar cualquier parámetro.">
                    <input type="checkbox" checked={!!aiPresetIAPowaSelected} onChange={(e) => onChangeAiPresetIAPowaSelected && onChangeAiPresetIAPowaSelected(e.target.checked)} /> IAPowa
                  </label>
                  {onApplyPresetIAPowaCurrent && (
                    <button onClick={onApplyPresetIAPowaCurrent} title="Aplicar IAPowa al jugador seleccionado">Aplicar al actual</button>
                  )}
                  {onApplyPresetIAPowaBoth && (
                    <button onClick={onApplyPresetIAPowaBoth} title="Aplicar IAPowa a ambos jugadores">Aplicar a ambos</button>
                  )}
                </div>
              </div>
            )}

            {/* Búsqueda base */}
            <SearchSettings
              aiEnableTT={aiEnableTT}
              onToggleAiEnableTT={onToggleAiEnableTT}
              aiFailSoft={aiFailSoft}
              onToggleAiFailSoft={onToggleAiFailSoft}
              aiPreferHashMove={aiPreferHashMove}
              onToggleAiPreferHashMove={onToggleAiPreferHashMove}
              aiEnablePVS={aiEnablePVS}
              onToggleAiEnablePVS={onToggleAiEnablePVS}
              aiEnableKillers={aiEnableKillers}
              onToggleAiEnableKillers={onToggleAiEnableKillers}
              aiEnableHistory={aiEnableHistory}
              onToggleAiEnableHistory={onToggleAiEnableHistory}
            />

            {/* Ventanas */}
            <WindowsSettings
              aiEnableAspiration={aiEnableAspiration}
              onToggleAiEnableAspiration={onToggleAiEnableAspiration}
              aiAspirationDelta={aiAspirationDelta}
              onChangeAiAspirationDelta={onChangeAiAspirationDelta}
            />

            {/* Quiescence */}
            <QuiescenceSettings
              aiEnableQuiescence={aiEnableQuiescence}
              onToggleAiEnableQuiescence={onToggleAiEnableQuiescence}
              aiQuiescenceDepth={aiQuiescenceDepth}
              onChangeAiQuiescenceDepth={onChangeAiQuiescenceDepth}
              aiQuiescenceHighTowerThreshold={aiQuiescenceHighTowerThreshold}
              onChangeAiQuiescenceHighTowerThreshold={onChangeAiQuiescenceHighTowerThreshold}
            />
          </div>
        </div>
      )}

      {/* Tab: Presets (CRUD) */}
      {activeTab === 'presets' && (
        <PresetsTab
          onApplyPresetCustom={props.aiApplyPresetCustom}
          initialItems={presetItems}
          onChangePresets={(items) => {
            try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
            setPresetItems(items as any);
            try { window.dispatchEvent(new CustomEvent('soluna:presets:update')); } catch {}
          }}
        />
      )}
    </section>
  );
}

