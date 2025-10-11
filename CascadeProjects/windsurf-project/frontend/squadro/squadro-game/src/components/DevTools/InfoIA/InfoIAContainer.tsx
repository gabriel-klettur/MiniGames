import React, { useEffect, useState, type ChangeEvent } from 'react';
import InfoIAView from './InfoIAView.tsx';
import { useInfoIASettings } from './hooks/useInfoIASettings.ts';
import { useCompareDatasets } from './hooks/useCompareDatasets.ts';
import { useRecords } from './hooks/useRecords.ts';
import { useSimulationRunner } from './hooks/useSimulationRunner.ts';
import type { EngineOptions } from '../../../ia/search/types';
import { loadPresets, type IAPreset } from '../../../ia/presets';

const InfoIAContainer: React.FC = () => {
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
    copyRecord,
    downloadRecord,
    flushNow,
  } = useRecords({ suspendPersistence });

  const sim = useSimulationRunner(
    {
      gamesCount: settings.gamesCount,
      p1Depth: settings.p1Depth,
      p2Depth: settings.p2Depth,
      p1Mode: settings.p1Mode,
      p2Mode: settings.p2Mode,
      p1Secs: settings.p1Secs,
      p2Secs: settings.p2Secs,
      vizRef: settings.vizRef,
      suspendPersistence,
      useRootParallel: settings.useRootParallel,
      workers: settings.workers,
      startEligibleLight: settings.startEligibleLight,
      startEligibleDark: settings.startEligibleDark,
      // Per-player engine options
      p1Options: settings.p1Engine as EngineOptions,
      p2Options: settings.p2Engine as EngineOptions,
      // Per-player evaluation weights
      p1Eval: settings.p1Eval,
      p2Eval: settings.p2Eval,
    },
    addRecord,
  );

  // Presets compartidos con IAPanel (localStorage / ia/presets)
  const [presetItems, setPresetItems] = useState<IAPreset[]>(() => loadPresets());
  useEffect(() => {
    // Listen for external updates (e.g., presets CRUD in IAPanel)
    const onUpdate = () => {
      try { setPresetItems(loadPresets()); } catch {}
    };
    window.addEventListener('squadro:presets:update', onUpdate);
    return () => window.removeEventListener('squadro:presets:update', onUpdate);
  }, []);
  const presetOptions = presetItems.map(it => ({ key: it.id, label: it.name }));

  const [p1PresetKey, setP1PresetKey] = useState<string>('');
  const [p2PresetKey, setP2PresetKey] = useState<string>('');

  const applyPreset = (key: string, who: 1 | 2) => {
    const found = presetItems.find(p => p.id === key);
    if (!found) return;
    const s = found.settings || {};
    // Depth and time mode/seconds
    if (who === 1) {
      if (typeof s.difficulty === 'number') settings.setP1Depth(s.difficulty);
      if (s.timeMode) settings.setP1Mode(s.timeMode as any);
      {
        const mode = (s.timeMode ?? settings.p1Mode) as 'auto' | 'manual';
        if (mode === 'auto') {
          settings.setP1Secs(0);
        } else if (typeof s.timeSeconds === 'number') {
          settings.setP1Secs(Math.max(0, Math.min(60, Math.round(s.timeSeconds))));
        }
      }
      // Engine toggles/LMR
      settings.setP1Engine(prev => ({
        ...prev,
        ...(typeof (s as any).enableTT === 'boolean' ? { enableTT: !!(s as any).enableTT } : {}),
        ...(typeof (s as any).enableKillers === 'boolean' ? { enableKillers: !!(s as any).enableKillers } : {}),
        ...(typeof (s as any).enableHistory === 'boolean' ? { enableHistory: !!(s as any).enableHistory } : {}),
        ...(typeof (s as any).enablePVS === 'boolean' ? { enablePVS: !!(s as any).enablePVS } : {}),
        ...(typeof (s as any).enableLMR === 'boolean' ? { enableLMR: !!(s as any).enableLMR } : {}),
        ...(typeof (s as any).enableQuiescence === 'boolean' ? { enableQuiescence: !!(s as any).enableQuiescence } : {}),
        ...(typeof (s as any).quiescenceMaxPlies === 'number' ? { quiescenceMaxPlies: Number((s as any).quiescenceMaxPlies) } : {}),
        ...(typeof (s as any).preferHashMove === 'boolean' ? { preferHashMove: !!(s as any).preferHashMove } : {}),
        ...(typeof (s as any).lmrMinDepth === 'number' ? { lmrMinDepth: Number((s as any).lmrMinDepth) } : {}),
        ...(typeof (s as any).lmrLateMoveIdx === 'number' ? { lmrLateMoveIdx: Number((s as any).lmrLateMoveIdx) } : {}),
        ...(typeof (s as any).lmrReduction === 'number' ? { lmrReduction: Number((s as any).lmrReduction) } : {}),
        ...(typeof (s as any).orderingJitterEps === 'number' ? { orderingJitterEps: Math.max(0, Number((s as any).orderingJitterEps)) } : {})
      }));
      // Heuristic weights
      if ((s as any).evalWeights && typeof (s as any).evalWeights === 'object') {
        settings.setP1Eval(prev => ({ ...prev, ...(s as any).evalWeights }));
      }
    } else {
      if (typeof s.difficulty === 'number') settings.setP2Depth(s.difficulty);
      if (s.timeMode) settings.setP2Mode(s.timeMode as any);
      {
        const mode = (s.timeMode ?? settings.p2Mode) as 'auto' | 'manual';
        if (mode === 'auto') {
          settings.setP2Secs(0);
        } else if (typeof s.timeSeconds === 'number') {
          settings.setP2Secs(Math.max(0, Math.min(60, Math.round(s.timeSeconds))));
        }
      }
      settings.setP2Engine(prev => ({
        ...prev,
        ...(typeof (s as any).enableTT === 'boolean' ? { enableTT: !!(s as any).enableTT } : {}),
        ...(typeof (s as any).enableKillers === 'boolean' ? { enableKillers: !!(s as any).enableKillers } : {}),
        ...(typeof (s as any).enableHistory === 'boolean' ? { enableHistory: !!(s as any).enableHistory } : {}),
        ...(typeof (s as any).enablePVS === 'boolean' ? { enablePVS: !!(s as any).enablePVS } : {}),
        ...(typeof (s as any).enableLMR === 'boolean' ? { enableLMR: !!(s as any).enableLMR } : {}),
        ...(typeof (s as any).enableQuiescence === 'boolean' ? { enableQuiescence: !!(s as any).enableQuiescence } : {}),
        ...(typeof (s as any).quiescenceMaxPlies === 'number' ? { quiescenceMaxPlies: Number((s as any).quiescenceMaxPlies) } : {}),
        ...(typeof (s as any).preferHashMove === 'boolean' ? { preferHashMove: !!(s as any).preferHashMove } : {}),
        ...(typeof (s as any).lmrMinDepth === 'number' ? { lmrMinDepth: Number((s as any).lmrMinDepth) } : {}),
        ...(typeof (s as any).lmrLateMoveIdx === 'number' ? { lmrLateMoveIdx: Number((s as any).lmrLateMoveIdx) } : {}),
        ...(typeof (s as any).lmrReduction === 'number' ? { lmrReduction: Number((s as any).lmrReduction) } : {}),
        ...(typeof (s as any).orderingJitterEps === 'number' ? { orderingJitterEps: Math.max(0, Number((s as any).orderingJitterEps)) } : {})
      }));
      if ((s as any).evalWeights && typeof (s as any).evalWeights === 'object') {
        settings.setP2Eval(prev => ({ ...prev, ...(s as any).evalWeights }));
      }
    }
  };

  // Ensure persistence resumes when the simulation finishes naturally.
  useEffect(() => {
    if (!sim.running) {
      setSuspendPersistence(false);
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
      compareHeads={compareSets.map((s: { id: string; name: string; color: string }) => ({ id: s.id, name: s.name, color: s.color }))}
      onAddCompare={() => { /* handled by file input */ }}
      onRemoveCompare={removeSet}
      onClearCompare={clearSets}
      chartDatasets={[
        { id: 'local', name: 'Local', color: '#22c55e', records: records.map((r: { durationMs: number }) => ({ durationMs: r.durationMs })) },
        ...compareSets.map((s: { id: string; name: string; color: string; records: Array<{ durationMs: number }> }) => ({ id: s.id, name: s.name, color: s.color, records: s.records }))
      ]}
      gamesCount={settings.gamesCount}
      onChangeGamesCount={settings.setGamesCount}
      useRootParallel={settings.useRootParallel}
      onToggleUseRootParallel={() => settings.setUseRootParallel(!settings.useRootParallel)}
      workers={settings.workers}
      onChangeWorkers={(n: number) => settings.setWorkers(Math.max(1, Math.min(32, n)))}
      startEligibleLight={settings.startEligibleLight}
      onToggleStartEligibleLight={() => settings.setStartEligibleLight(!settings.startEligibleLight)}
      startEligibleDark={settings.startEligibleDark}
      onToggleStartEligibleDark={() => settings.setStartEligibleDark(!settings.startEligibleDark)}
      p1={{
        title: 'Jugador 1 (Light)',
        depth: settings.p1Depth,
        onChangeDepth: settings.setP1Depth,
        timeMode: settings.p1Mode,
        onChangeTimeMode: settings.setP1Mode,
        timeSeconds: settings.p1Secs,
        onChangeTimeSeconds: settings.setP1Secs,
        presetOptions,
        presetSelectedKey: p1PresetKey,
        onChangePreset: (key: string) => { setP1PresetKey(key); if (key) applyPreset(key, 1); },
        enableTT: settings.p1Engine.enableTT,
        onToggleEnableTT: () => settings.setP1Engine(prev => ({ ...prev, enableTT: !prev.enableTT })),
        enableKillers: settings.p1Engine.enableKillers,
        onToggleEnableKillers: () => settings.setP1Engine(prev => ({ ...prev, enableKillers: !prev.enableKillers })),
        enableHistory: settings.p1Engine.enableHistory,
        onToggleEnableHistory: () => settings.setP1Engine(prev => ({ ...prev, enableHistory: !prev.enableHistory })),
        preferHashMove: settings.p1Engine.preferHashMove,
        onTogglePreferHashMove: () => settings.setP1Engine(prev => ({ ...prev, preferHashMove: !prev.preferHashMove })),
        enablePVS: settings.p1Engine.enablePVS,
        onToggleEnablePVS: () => settings.setP1Engine(prev => ({ ...prev, enablePVS: !prev.enablePVS })),
        // Quiescence
        enableQuiescence: (settings.p1Engine as any).enableQuiescence,
        onToggleEnableQuiescence: () => settings.setP1Engine(prev => ({ ...prev, enableQuiescence: !(prev as any).enableQuiescence } as any)),
        quiescenceMaxPlies: (settings.p1Engine as any).quiescenceMaxPlies,
        onChangeQuiescenceMaxPlies: (n: number) => settings.setP1Engine(prev => ({ ...prev, quiescenceMaxPlies: n } as any)),
        // LMR
        enableLMR: settings.p1Engine.enableLMR,
        onToggleEnableLMR: () => settings.setP1Engine(prev => ({ ...prev, enableLMR: !prev.enableLMR })),
        lmrMinDepth: settings.p1Engine.lmrMinDepth,
        onChangeLmrMinDepth: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrMinDepth: n })),
        lmrLateMoveIdx: settings.p1Engine.lmrLateMoveIdx,
        onChangeLmrLateMoveIdx: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrLateMoveIdx: n })),
        lmrReduction: settings.p1Engine.lmrReduction,
        onChangeLmrReduction: (n: number) => settings.setP1Engine(prev => ({ ...prev, lmrReduction: n })),
        // Ordering jitter
        orderingJitterEps: (settings.p1Engine as any).orderingJitterEps,
        onChangeOrderingJitterEps: (n: number) => settings.setP1Engine(prev => ({ ...prev, orderingJitterEps: Math.max(0, n) } as any)),
      }}
      p2={{
        title: 'Jugador 2 (Dark)',
        depth: settings.p2Depth,
        onChangeDepth: settings.setP2Depth,
        timeMode: settings.p2Mode,
        onChangeTimeMode: settings.setP2Mode,
        timeSeconds: settings.p2Secs,
        onChangeTimeSeconds: settings.setP2Secs,
        presetOptions,
        presetSelectedKey: p2PresetKey,
        onChangePreset: (key: string) => { setP2PresetKey(key); if (key) applyPreset(key, 2); },
        enableTT: settings.p2Engine.enableTT,
        onToggleEnableTT: () => settings.setP2Engine(prev => ({ ...prev, enableTT: !prev.enableTT })),
        enableKillers: settings.p2Engine.enableKillers,
        onToggleEnableKillers: () => settings.setP2Engine(prev => ({ ...prev, enableKillers: !prev.enableKillers })),
        enableHistory: settings.p2Engine.enableHistory,
        onToggleEnableHistory: () => settings.setP2Engine(prev => ({ ...prev, enableHistory: !prev.enableHistory })),
        preferHashMove: settings.p2Engine.preferHashMove,
        onTogglePreferHashMove: () => settings.setP2Engine(prev => ({ ...prev, preferHashMove: !prev.preferHashMove })),
        enablePVS: settings.p2Engine.enablePVS,
        onToggleEnablePVS: () => settings.setP2Engine(prev => ({ ...prev, enablePVS: !prev.enablePVS })),
        // Quiescence
        enableQuiescence: (settings.p2Engine as any).enableQuiescence,
        onToggleEnableQuiescence: () => settings.setP2Engine(prev => ({ ...prev, enableQuiescence: !(prev as any).enableQuiescence } as any)),
        quiescenceMaxPlies: (settings.p2Engine as any).quiescenceMaxPlies,
        onChangeQuiescenceMaxPlies: (n: number) => settings.setP2Engine(prev => ({ ...prev, quiescenceMaxPlies: n } as any)),
        // LMR
        enableLMR: settings.p2Engine.enableLMR,
        onToggleEnableLMR: () => settings.setP2Engine(prev => ({ ...prev, enableLMR: !prev.enableLMR })),
        lmrMinDepth: settings.p2Engine.lmrMinDepth,
        onChangeLmrMinDepth: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrMinDepth: n })),
        lmrLateMoveIdx: settings.p2Engine.lmrLateMoveIdx,
        onChangeLmrLateMoveIdx: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrLateMoveIdx: n })),
        lmrReduction: settings.p2Engine.lmrReduction,
        onChangeLmrReduction: (n: number) => settings.setP2Engine(prev => ({ ...prev, lmrReduction: n })),
        // Ordering jitter
        orderingJitterEps: (settings.p2Engine as any).orderingJitterEps,
        onChangeOrderingJitterEps: (n: number) => settings.setP2Engine(prev => ({ ...prev, orderingJitterEps: Math.max(0, n) } as any)),
      }}
      records={records}
      moveIndex={sim.moveIndex}
      moveElapsedMs={sim.moveElapsedMs}
      moveTargetMs={sim.moveTargetMs}
      progDepth={sim.progDepth}
      progNodes={sim.progNodes}
      progNps={sim.progNps}
      progScore={sim.progScore}
      onCopyRecord={copyRecord}
      onDownloadRecord={downloadRecord}
      onDeleteRecord={deleteRecord}
    />
  );
};

export default InfoIAContainer;
