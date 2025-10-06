import React, { useEffect, useRef, type ChangeEvent, useState } from 'react';
import InfoIAView from './InfoIAView';
import type { GameState } from '../../../game/types';
import { useGame } from '../../../game/store';
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { useInfoIASettings } from './hooks/useInfoIASettings';
import { useRecords } from './hooks/useRecords';
import { useSimulationRunner } from './hooks/useSimulationRunner';
import { IAPOWA_PRESET, IAPOWA_PERFORMANCE_PRESET, IAPOWA_DEFENSE_PRESET } from '../../../ia/search/options';
const InfoIAContainer: React.FC = () => {
  const { state } = useGame();

  const stateRef = useRef<GameState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const settings = useInfoIASettings();
  // Suspend localStorage persistence while long simulations are running to avoid UI jank.
  const [suspendPersistence, setSuspendPersistence] = useState<boolean>(false);
  const { compareSets, addFilesFromFileList, removeSet, clearSets } = useCompareDatasets();
  const {
    records,
    addRecord,
    deleteRecord,
    clearAll,
    exportJSON,
    exportCSV,
    exportCSVDetails,
    viewRecord,
    copyRecord,
    downloadRecord,
    flushNow,
  } = useRecords({ suspendPersistence });
  const sim = useSimulationRunner(
    {
      setsCount: settings.setsCount,
      p1Depth: settings.p1Depth,
      p2Depth: settings.p2Depth,
      p1Mode: settings.p1Mode,
      p2Mode: settings.p2Mode,
      p1Secs: settings.p1Secs,
      p2Secs: settings.p2Secs,
      vizRef: settings.vizRef,
      suspendPersistence,
      enableTT: settings.enableTT,
      failSoft: settings.failSoft,
      preferHashMove: settings.preferHashMove,
      enableKillers: settings.enableKillers,
      enableHistory: settings.enableHistory,
      enablePVS: settings.enablePVS,
      enableAspiration: settings.enableAspiration,
      aspirationDelta: settings.aspirationDelta,
      enableQuiescence: settings.enableQuiescence,
      quiescenceDepth: settings.quiescenceDepth,
      // Per-player engine options override global flags when provided
      p1Options: settings.p1Engine,
      p2Options: settings.p2Engine,
    },
    addRecord,
    () => stateRef.current,
  );

  // Preset selection state per player (key string, future-proof for more presets)
  const [p1PresetKey, setP1PresetKey] = useState<string>('');
  const [p2PresetKey, setP2PresetKey] = useState<string>('');
  const presetOptions = [
    { key: 'iapowa', label: 'IAPowa' },
    { key: 'iapowa_perf', label: 'IAPowa+Rendimiento' },
    { key: 'iapowa_def', label: 'IAPowa+Defensa' },
  ];
  const applyPreset = (key: string, who: 1 | 2) => {
    const pick = key === 'iapowa' ? IAPOWA_PRESET : key === 'iapowa_perf' ? IAPOWA_PERFORMANCE_PRESET : key === 'iapowa_def' ? IAPOWA_DEFENSE_PRESET : undefined;
    if (!pick) return;
    if (who === 1) settings.setP1Engine({ ...pick }); else settings.setP2Engine({ ...pick });
  };
  // Helper: compare engine to preset; clear selection only when it deviates from the selected preset
  const equalEngine = (a: any, b: any) => {
    try {
      const sa = JSON.stringify(a, Object.keys(a).sort());
      const sb = JSON.stringify(b, Object.keys(b).sort());
      return sa === sb;
    } catch { return false; }
  };
  const getPreset = (key: string) => (key === 'iapowa' ? IAPOWA_PRESET : key === 'iapowa_perf' ? IAPOWA_PERFORMANCE_PRESET : key === 'iapowa_def' ? IAPOWA_DEFENSE_PRESET : undefined);
  useEffect(() => {
    if (!p1PresetKey) return;
    const p = getPreset(p1PresetKey);
    if (p && !equalEngine(settings.p1Engine, p)) setP1PresetKey('');
  }, [settings.p1Engine, p1PresetKey]);
  useEffect(() => {
    if (!p2PresetKey) return;
    const p = getPreset(p2PresetKey);
    if (p && !equalEngine(settings.p2Engine, p)) setP2PresetKey('');
  }, [settings.p2Engine, p2PresetKey]);

  // Ensure persistence resumes when the simulation finishes naturally.
  useEffect(() => {
    if (!sim.running) {
      setSuspendPersistence(false);
      // Force a flush to avoid losing data if user refreshes immediately after finish
      flushNow();
    }
  }, [sim.running, flushNow]);

  const handleStart = () => {
    setSuspendPersistence(true);
    sim.start();
  };

  const handleStop = () => {
    sim.stop();
    setSuspendPersistence(false);
    // Ensure immediate persistence upon manual stop
    flushNow();
  };

  const onImportFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    void addFilesFromFileList(files);
    try { (e.target as HTMLInputElement).value = ''; } catch {}
  };
  return (
    <InfoIAView
      running={sim.running}
      onStart={handleStart}
      onStop={handleStop}
      onDefaults={settings.resetDefaults}
      onExportJSON={exportJSON}
      onExportCSV={exportCSV}
      onExportCSVDetails={exportCSVDetails}
      onImportFiles={onImportFiles}
      onClearAll={clearAll}
      activeTab={settings.activeTab}
      onChangeTab={settings.setActiveTab}
      compareHeads={compareSets.map(s => ({ id: s.id, name: s.name, color: s.color }))}
      onAddCompare={() => { /* handled by file input */ }}
      onRemoveCompare={removeSet}
      onClearCompare={clearSets}
      chartDatasets={[
        { id: 'local', name: 'Local', color: '#22c55e', records: records.map(r => ({ durationMs: r.durationMs })) },
        ...compareSets.map(s => ({ id: s.id, name: s.name, color: s.color, records: s.records }))
      ]}
      setsCount={settings.setsCount}
      onChangeSetsCount={settings.setSetsCount}
      p1={{
        title: 'Jugador 1 (ficha clara)',
        depth: settings.p1Depth,
        onChangeDepth: settings.setP1Depth,
        timeMode: settings.p1Mode,
        onChangeTimeMode: settings.setP1Mode,
        timeSeconds: settings.p1Secs,
        onChangeTimeSeconds: settings.setP1Secs,
        presetOptions,
        presetSelectedKey: p1PresetKey,
        onChangePreset: (key: string) => { setP1PresetKey(key); if (key) applyPreset(key, 1); },
        // Engine options UI (per-player)
        enableTT: !!settings.p1Engine.enableTT,
        onToggleEnableTT: () => settings.setP1Engine(prev => ({ ...prev, enableTT: !prev.enableTT })),
        failSoft: !!settings.p1Engine.failSoft,
        onToggleFailSoft: () => settings.setP1Engine(prev => ({ ...prev, failSoft: !prev.failSoft })),
        preferHashMove: !!settings.p1Engine.preferHashMove,
        onTogglePreferHashMove: () => settings.setP1Engine(prev => ({ ...prev, preferHashMove: !prev.preferHashMove })),
        enableKillers: !!settings.p1Engine.enableKillers,
        onToggleEnableKillers: () => settings.setP1Engine(prev => ({ ...prev, enableKillers: !prev.enableKillers })),
        enableHistory: !!settings.p1Engine.enableHistory,
        onToggleEnableHistory: () => settings.setP1Engine(prev => ({ ...prev, enableHistory: !prev.enableHistory })),
        enablePVS: !!settings.p1Engine.enablePVS,
        onToggleEnablePVS: () => settings.setP1Engine(prev => ({ ...prev, enablePVS: !prev.enablePVS })),
        enableAspiration: !!settings.p1Engine.enableAspiration,
        onToggleEnableAspiration: () => settings.setP1Engine(prev => ({ ...prev, enableAspiration: !prev.enableAspiration })),
        aspirationDelta: settings.p1Engine.aspirationDelta ?? 35,
        onChangeAspirationDelta: (n: number) => settings.setP1Engine(prev => ({ ...prev, aspirationDelta: n })),
        enableQuiescence: !!settings.p1Engine.enableQuiescence,
        onToggleEnableQuiescence: () => settings.setP1Engine(prev => ({ ...prev, enableQuiescence: !prev.enableQuiescence })),
        quiescenceDepth: settings.p1Engine.quiescenceDepth ?? 3,
        onChangeQuiescenceDepth: (n: number) => settings.setP1Engine(prev => ({ ...prev, quiescenceDepth: n })),
        quiescenceHighTowerThreshold: settings.p1Engine.quiescenceHighTowerThreshold ?? 5,
        onChangeQuiescenceHighTowerThreshold: (n: number) => settings.setP1Engine(prev => ({ ...prev, quiescenceHighTowerThreshold: n })),
        enableLMR: settings.p1Engine.enableLMR ?? true,
        onToggleEnableLMR: () => settings.setP1Engine(prev => ({ ...prev, enableLMR: !prev.enableLMR })),
        lmrMinDepth: settings.p1Engine.lmrMinDepth ?? 3,
        onChangeLmrMinDepth: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrMinDepth: n })),
        lmrLateMoveIdx: settings.p1Engine.lmrLateMoveIdx ?? 4,
        onChangeLmrLateMoveIdx: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrLateMoveIdx: n })),
        lmrReduction: settings.p1Engine.lmrReduction ?? 1,
        onChangeLmrReduction: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrReduction: n })),
        enableFutility: settings.p1Engine.enableFutility ?? true,
        onToggleEnableFutility: () => settings.setP1Engine(prev => ({ ...prev, enableFutility: !prev.enableFutility })),
        futilityMargin: settings.p1Engine.futilityMargin ?? 50,
        onChangeFutilityMargin: (n: number) => settings.setP1Engine(prev => ({ ...prev, futilityMargin: n })),
        enableLMP: settings.p1Engine.enableLMP ?? true,
        onToggleEnableLMP: () => settings.setP1Engine(prev => ({ ...prev, enableLMP: !prev.enableLMP })),
        lmpDepthThreshold: settings.p1Engine.lmpDepthThreshold ?? 2,
        onChangeLmpDepthThreshold: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmpDepthThreshold: n })),
        lmpLateMoveIdx: settings.p1Engine.lmpLateMoveIdx ?? 6,
        onChangeLmpLateMoveIdx: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmpLateMoveIdx: n })),
        enableNullMove: settings.p1Engine.enableNullMove ?? true,
        onToggleEnableNullMove: () => settings.setP1Engine(prev => ({ ...prev, enableNullMove: !prev.enableNullMove })),
        nullMoveReduction: settings.p1Engine.nullMoveReduction ?? 2,
        onChangeNullMoveReduction: (n: number) => settings.setP1Engine(prev => ({ ...prev, nullMoveReduction: n })),
        nullMoveMinDepth: settings.p1Engine.nullMoveMinDepth ?? 3,
        onChangeNullMoveMinDepth: (n: number) => settings.setP1Engine(prev => ({ ...prev, nullMoveMinDepth: n })),
      }}
      p2={{
        title: 'Jugador 2 (ficha oscura)',
        depth: settings.p2Depth,
        onChangeDepth: settings.setP2Depth,
        timeMode: settings.p2Mode,
        onChangeTimeMode: settings.setP2Mode,
        timeSeconds: settings.p2Secs,
        onChangeTimeSeconds: settings.setP2Secs,
        presetOptions,
        presetSelectedKey: p2PresetKey,
        onChangePreset: (key: string) => { setP2PresetKey(key); if (key) applyPreset(key, 2); },
        // Engine options UI (per-player)
        enableTT: !!settings.p2Engine.enableTT,
        onToggleEnableTT: () => settings.setP2Engine(prev => ({ ...prev, enableTT: !prev.enableTT })),
        failSoft: !!settings.p2Engine.failSoft,
        onToggleFailSoft: () => settings.setP2Engine(prev => ({ ...prev, failSoft: !prev.failSoft })),
        preferHashMove: !!settings.p2Engine.preferHashMove,
        onTogglePreferHashMove: () => settings.setP2Engine(prev => ({ ...prev, preferHashMove: !prev.preferHashMove })),
        enableKillers: !!settings.p2Engine.enableKillers,
        onToggleEnableKillers: () => settings.setP2Engine(prev => ({ ...prev, enableKillers: !prev.enableKillers })),
        enableHistory: !!settings.p2Engine.enableHistory,
        onToggleEnableHistory: () => settings.setP2Engine(prev => ({ ...prev, enableHistory: !prev.enableHistory })),
        enablePVS: !!settings.p2Engine.enablePVS,
        onToggleEnablePVS: () => settings.setP2Engine(prev => ({ ...prev, enablePVS: !prev.enablePVS })),
        enableAspiration: !!settings.p2Engine.enableAspiration,
        onToggleEnableAspiration: () => settings.setP2Engine(prev => ({ ...prev, enableAspiration: !prev.enableAspiration })),
        aspirationDelta: settings.p2Engine.aspirationDelta ?? 35,
        onChangeAspirationDelta: (n: number) => settings.setP2Engine(prev => ({ ...prev, aspirationDelta: n })),
        enableQuiescence: !!settings.p2Engine.enableQuiescence,
        onToggleEnableQuiescence: () => settings.setP2Engine(prev => ({ ...prev, enableQuiescence: !prev.enableQuiescence })),
        quiescenceDepth: settings.p2Engine.quiescenceDepth ?? 3,
        onChangeQuiescenceDepth: (n: number) => settings.setP2Engine(prev => ({ ...prev, quiescenceDepth: n })),
        quiescenceHighTowerThreshold: settings.p2Engine.quiescenceHighTowerThreshold ?? 5,
        onChangeQuiescenceHighTowerThreshold: (n: number) => settings.setP2Engine(prev => ({ ...prev, quiescenceHighTowerThreshold: n })),
        enableLMR: settings.p2Engine.enableLMR ?? true,
        onToggleEnableLMR: () => settings.setP2Engine(prev => ({ ...prev, enableLMR: !prev.enableLMR })),
        lmrMinDepth: settings.p2Engine.lmrMinDepth ?? 3,
        onChangeLmrMinDepth: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrMinDepth: n })),
        lmrLateMoveIdx: settings.p2Engine.lmrLateMoveIdx ?? 4,
        onChangeLmrLateMoveIdx: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrLateMoveIdx: n })),
        lmrReduction: settings.p2Engine.lmrReduction ?? 1,
        onChangeLmrReduction: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrReduction: n })),
        enableFutility: settings.p2Engine.enableFutility ?? true,
        onToggleEnableFutility: () => settings.setP2Engine(prev => ({ ...prev, enableFutility: !prev.enableFutility })),
        futilityMargin: settings.p2Engine.futilityMargin ?? 50,
        onChangeFutilityMargin: (n: number) => settings.setP2Engine(prev => ({ ...prev, futilityMargin: n })),
        enableLMP: settings.p2Engine.enableLMP ?? true,
        onToggleEnableLMP: () => settings.setP2Engine(prev => ({ ...prev, enableLMP: !prev.enableLMP })),
        lmpDepthThreshold: settings.p2Engine.lmpDepthThreshold ?? 2,
        onChangeLmpDepthThreshold: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmpDepthThreshold: n })),
        lmpLateMoveIdx: settings.p2Engine.lmpLateMoveIdx ?? 6,
        onChangeLmpLateMoveIdx: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmpLateMoveIdx: n })),
        enableNullMove: settings.p2Engine.enableNullMove ?? true,
        onToggleEnableNullMove: () => settings.setP2Engine(prev => ({ ...prev, enableNullMove: !prev.enableNullMove })),
        nullMoveReduction: settings.p2Engine.nullMoveReduction ?? 2,
        onChangeNullMoveReduction: (n: number) => settings.setP2Engine(prev => ({ ...prev, nullMoveReduction: n })),
        nullMoveMinDepth: settings.p2Engine.nullMoveMinDepth ?? 3,
        onChangeNullMoveMinDepth: (n: number) => settings.setP2Engine(prev => ({ ...prev, nullMoveMinDepth: n })),
      }}
      records={records}
      moveIndex={sim.moveIndex}
      moveElapsedMs={sim.moveElapsedMs}
      moveTargetMs={sim.moveTargetMs}
      progDepth={sim.progDepth}
      progNodes={sim.progNodes}
      progNps={sim.progNps}
      progScore={sim.progScore}
      onViewRecord={viewRecord}
      onCopyRecord={copyRecord}
      onDownloadRecord={downloadRecord}
      onDeleteRecord={deleteRecord}
    />
  );
};

export default InfoIAContainer;
