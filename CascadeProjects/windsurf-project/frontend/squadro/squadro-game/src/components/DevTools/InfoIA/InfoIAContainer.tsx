import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import InfoIAView from './InfoIAView.tsx';
import { useInfoIASettings } from './hooks/useInfoIASettings.ts';
import { useCompareDatasets } from './hooks/useCompareDatasets.ts';
import { useRecords } from './hooks/useRecords.ts';
import { useSimulationRunner } from './hooks/useSimulationRunner.ts';
import type { EngineOptions } from '../../../ia/search/types';
import { loadPresets, setSelectedPresetId, type IAPreset } from '../../../ia/presets';
import { loadLastSuite, saveLastSuite } from './services/storage.ts';

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
      randomOpeningPlies: settings.randomOpeningPlies,
      traceHeuristics: settings.traceHeuristics,
      // Per-player engine options
      p1Options: settings.p1Engine as EngineOptions,
      p2Options: settings.p2Engine as EngineOptions,
      // Per-player evaluation weights
      p1Eval: settings.p1Eval,
      p2Eval: settings.p2Eval,
    },
    addRecord,
  );

  // Regression suite state (results)
  const [suiteResult, setSuiteResult] = useState<import('../../../tests/runSuite').SuiteResult | null>(null);
  const [baselineSuite, setBaselineSuite] = useState<import('../../../tests/runSuite').SuiteResult | null>(null);
  const [suiteDiff, setSuiteDiff] = useState<{
    broke: string[];
    fixed: string[];
    changed: Array<{ name: string; from: { moveId: string | null; score: number; depthReached: number } | null; to: { moveId: string | null; score: number; depthReached: number } | null }>;
    newCases: string[];
    removed: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const last = loadLastSuite();
      if (last && typeof last === 'object' && Array.isArray(last.details)) setBaselineSuite(last);
    } catch {}
  }, []);

  const computeSuiteDiff = (
    base: import('../../../tests/runSuite').SuiteResult | null,
    cur: import('../../../tests/runSuite').SuiteResult | null,
  ) => {
    if (!base || !cur) return null;
    const byName = (arr: typeof base.details) => {
      const m = new Map<string, typeof arr[number]>();
      for (const d of arr) m.set(d.name, d);
      return m;
    };
    const a = byName(base.details);
    const b = byName(cur.details);
    const broke: string[] = [];
    const fixed: string[] = [];
    const changed: Array<{ name: string; from: any; to: any }> = [];
    const newCases: string[] = [];
    const removed: string[] = [];
    for (const [name, d0] of a.entries()) {
      const d1 = b.get(name);
      if (!d1) { removed.push(name); continue; }
      if (d0.ok && !d1.ok) broke.push(name);
      if (!d0.ok && d1.ok) fixed.push(name);
      if ((d0.moveId !== d1.moveId) || (d0.score !== d1.score) || (d0.depthReached !== d1.depthReached)) {
        changed.push({ name, from: { moveId: d0.moveId, score: d0.score, depthReached: d0.depthReached }, to: { moveId: d1.moveId, score: d1.score, depthReached: d1.depthReached } });
      }
    }
    for (const [name] of b.entries()) {
      if (!a.has(name)) newCases.push(name);
    }
    return { broke, fixed, changed, newCases, removed };
  };

  const handleRunSuite = async () => {
    try {
      setSuspendPersistence(true);
      setSuiteResult(null);
      const mod = await import('../../../tests/runSuite');
      const res = await mod.runSuite();
      setSuiteResult(res);
      const diff = computeSuiteDiff(baselineSuite, res);
      setSuiteDiff(diff);
      saveLastSuite(res);
      setBaselineSuite(res);
    } catch (err) {
      console.error('runSuite failed', err);
      setSuiteResult({ total: 0, passed: 0, failed: 0, details: [] });
    } finally {
      setSuspendPersistence(false);
      flushNow();
    }
  };

  const handleExportJUnit = async () => {
    try {
      if (!suiteResult) return;
      const { toJUnitXml } = await import('../../../tests/reporters');
      const xml = toJUnitXml(suiteResult, 'SquadroRegression');
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'squadro-regression-junit.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Engine stats from last search (global)
  const engineStats = useAppSelector((s: RootState) => (s.game.ai?.engineStats ? { ...s.game.ai.engineStats } : null));

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
        ...(typeof (s as any).enableTablebase === 'boolean' ? { enableTablebase: !!(s as any).enableTablebase } : {}),
        // New pruning and IID options
        ...(typeof (s as any).enableLMP === 'boolean' ? { enableLMP: !!(s as any).enableLMP } : {}),
        ...(typeof (s as any).lmpMaxDepth === 'number' ? { lmpMaxDepth: Number((s as any).lmpMaxDepth) } : {}),
        ...(typeof (s as any).lmpBase === 'number' ? { lmpBase: Number((s as any).lmpBase) } : {}),
        ...(typeof (s as any).enableFutility === 'boolean' ? { enableFutility: !!(s as any).enableFutility } : {}),
        ...(typeof (s as any).futilityMargin === 'number' ? { futilityMargin: Number((s as any).futilityMargin) } : {}),
        ...(typeof (s as any).enableIID === 'boolean' ? { enableIID: !!(s as any).enableIID } : {}),
        ...(typeof (s as any).iidMinDepth === 'number' ? { iidMinDepth: Number((s as any).iidMinDepth) } : {}),
        // Quiescence margins/extensions
        ...(typeof (s as any).quiescenceStandPatMargin === 'number' ? { quiescenceStandPatMargin: Number((s as any).quiescenceStandPatMargin) } : {}),
        ...(typeof (s as any).quiescenceSeeMargin === 'number' ? { quiescenceSeeMargin: Number((s as any).quiescenceSeeMargin) } : {}),
        ...(typeof (s as any).quiescenceExtendOnRetire === 'boolean' ? { quiescenceExtendOnRetire: !!(s as any).quiescenceExtendOnRetire } : {}),
        ...(typeof (s as any).quiescenceExtendOnJump === 'boolean' ? { quiescenceExtendOnJump: !!(s as any).quiescenceExtendOnJump } : {}),
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
        ...(typeof (s as any).enableTablebase === 'boolean' ? { enableTablebase: !!(s as any).enableTablebase } : {}),
        // New pruning and IID options
        ...(typeof (s as any).enableLMP === 'boolean' ? { enableLMP: !!(s as any).enableLMP } : {}),
        ...(typeof (s as any).lmpMaxDepth === 'number' ? { lmpMaxDepth: Number((s as any).lmpMaxDepth) } : {}),
        ...(typeof (s as any).lmpBase === 'number' ? { lmpBase: Number((s as any).lmpBase) } : {}),
        ...(typeof (s as any).enableFutility === 'boolean' ? { enableFutility: !!(s as any).enableFutility } : {}),
        ...(typeof (s as any).futilityMargin === 'number' ? { futilityMargin: Number((s as any).futilityMargin) } : {}),
        ...(typeof (s as any).enableIID === 'boolean' ? { enableIID: !!(s as any).enableIID } : {}),
        ...(typeof (s as any).iidMinDepth === 'number' ? { iidMinDepth: Number((s as any).iidMinDepth) } : {}),
        // Quiescence margins/extensions
        ...(typeof (s as any).quiescenceStandPatMargin === 'number' ? { quiescenceStandPatMargin: Number((s as any).quiescenceStandPatMargin) } : {}),
        ...(typeof (s as any).quiescenceSeeMargin === 'number' ? { quiescenceSeeMargin: Number((s as any).quiescenceSeeMargin) } : {}),
        ...(typeof (s as any).quiescenceExtendOnRetire === 'boolean' ? { quiescenceExtendOnRetire: !!(s as any).quiescenceExtendOnRetire } : {}),
        ...(typeof (s as any).quiescenceExtendOnJump === 'boolean' ? { quiescenceExtendOnJump: !!(s as any).quiescenceExtendOnJump } : {}),
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
    // Persist selection and notify listeners for cross-panel sync
    try { setSelectedPresetId(key); } catch {}
    try { window.dispatchEvent(new Event('squadro:presets:update')); } catch {}
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
      randomOpeningPlies={settings.randomOpeningPlies}
      onChangeRandomOpeningPlies={(n: number) => settings.setRandomOpeningPlies(Math.max(0, Math.min(20, n)))}
      traceHeuristics={settings.traceHeuristics}
      onToggleTraceHeuristics={() => settings.setTraceHeuristics(!settings.traceHeuristics)}
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
        // Tablebase
        enableTablebase: (settings.p1Engine as any).enableTablebase,
        onToggleEnableTablebase: () => settings.setP1Engine(prev => ({ ...prev, enableTablebase: !(prev as any).enableTablebase } as any)),
        // DF-PN
        enableDFPN: (settings.p1Engine as any).enableDFPN,
        onToggleEnableDFPN: () => settings.setP1Engine(prev => ({ ...prev, enableDFPN: !(prev as any).enableDFPN } as any)),
        dfpnMaxActive: (settings.p1Engine as any).dfpnMaxActive,
        onChangeDfpnMaxActive: (n: number) => settings.setP1Engine(prev => ({ ...prev, dfpnMaxActive: Math.max(0, Math.min(10, n)) } as any)),
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
        // Heuristic weights
        w_race: settings.p1Eval.w_race,
        onChangeWRace: (n: number) => settings.setP1Eval(prev => ({ ...prev, w_race: n })),
        w_clash: settings.p1Eval.w_clash,
        onChangeWClash: (n: number) => settings.setP1Eval(prev => ({ ...prev, w_clash: n })),
        w_sprint: settings.p1Eval.w_sprint,
        onChangeWSprint: (n: number) => settings.setP1Eval(prev => ({ ...prev, w_sprint: n })),
        w_block: settings.p1Eval.w_block,
        onChangeWBlock: (n: number) => settings.setP1Eval(prev => ({ ...prev, w_block: n })),
        done_bonus: settings.p1Eval.done_bonus,
        onChangeDoneBonus: (n: number) => settings.setP1Eval(prev => ({ ...prev, done_bonus: n })),
        sprint_threshold: settings.p1Eval.sprint_threshold,
        onChangeSprintThreshold: (n: number) => settings.setP1Eval(prev => ({ ...prev, sprint_threshold: n })),
        tempo: settings.p1Eval.tempo,
        onChangeTempo: (n: number) => settings.setP1Eval(prev => ({ ...prev, tempo: n })),
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
        // Tablebase
        enableTablebase: (settings.p2Engine as any).enableTablebase,
        onToggleEnableTablebase: () => settings.setP2Engine(prev => ({ ...prev, enableTablebase: !(prev as any).enableTablebase } as any)),
        // DF-PN
        enableDFPN: (settings.p2Engine as any).enableDFPN,
        onToggleEnableDFPN: () => settings.setP2Engine(prev => ({ ...prev, enableDFPN: !(prev as any).enableDFPN } as any)),
        dfpnMaxActive: (settings.p2Engine as any).dfpnMaxActive,
        onChangeDfpnMaxActive: (n: number) => settings.setP2Engine(prev => ({ ...prev, dfpnMaxActive: Math.max(0, Math.min(10, n)) } as any)),
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
        // Heuristic weights
        w_race: settings.p2Eval.w_race,
        onChangeWRace: (n: number) => settings.setP2Eval(prev => ({ ...prev, w_race: n })),
        w_clash: settings.p2Eval.w_clash,
        onChangeWClash: (n: number) => settings.setP2Eval(prev => ({ ...prev, w_clash: n })),
        w_sprint: settings.p2Eval.w_sprint,
        onChangeWSprint: (n: number) => settings.setP2Eval(prev => ({ ...prev, w_sprint: n })),
        w_block: settings.p2Eval.w_block,
        onChangeWBlock: (n: number) => settings.setP2Eval(prev => ({ ...prev, w_block: n })),
        done_bonus: settings.p2Eval.done_bonus,
        onChangeDoneBonus: (n: number) => settings.setP2Eval(prev => ({ ...prev, done_bonus: n })),
        sprint_threshold: settings.p2Eval.sprint_threshold,
        onChangeSprintThreshold: (n: number) => settings.setP2Eval(prev => ({ ...prev, sprint_threshold: n })),
        tempo: settings.p2Eval.tempo,
        onChangeTempo: (n: number) => settings.setP2Eval(prev => ({ ...prev, tempo: n })),
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
      onRunSuite={handleRunSuite}
      suiteDiff={suiteDiff}
      onExportJUnit={suiteResult ? handleExportJUnit : undefined}
      suiteResult={suiteResult}
      engineStats={engineStats}
    />
  );
};

export default InfoIAContainer;
