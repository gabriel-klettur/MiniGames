import React, { useEffect, useRef, type ChangeEvent, useState } from 'react';
import InfoIAView from './InfoIAView';
import type { GameState } from '../../../game/types';
import { useGame } from '../../../game/store';
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { useInfoIASettings } from './hooks/useInfoIASettings';
import { useRecords } from './hooks/useRecords';
import { useSimulationRunner } from './hooks/useSimulationRunner';
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
      enableTT: settings.enableTT,
      failSoft: settings.failSoft,
      preferHashMove: settings.preferHashMove,
      enableKillers: settings.enableKillers,
      enableHistory: settings.enableHistory,
      enablePVS: settings.enablePVS,
      enableAspiration: settings.enableAspiration,
      aspirationDelta: settings.aspirationDelta,
    },
    addRecord,
    () => stateRef.current,
  );

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
      visualize={settings.visualize}
      onToggleVisualize={settings.toggleVisualize}
      datasetLabel={settings.datasetLabel}
      enableTT={settings.enableTT}
      failSoft={settings.failSoft}
      preferHashMove={settings.preferHashMove}
      onToggleEnableTT={settings.toggleEnableTT}
      onToggleFailSoft={settings.toggleFailSoft}
      onTogglePreferHashMove={settings.togglePreferHashMove}
      enableKillers={settings.enableKillers}
      enableHistory={settings.enableHistory}
      onToggleEnableKillers={settings.toggleEnableKillers}
      onToggleEnableHistory={settings.toggleEnableHistory}
      enablePVS={settings.enablePVS}
      onToggleEnablePVS={settings.toggleEnablePVS}
      enableAspiration={settings.enableAspiration}
      onToggleEnableAspiration={settings.toggleEnableAspiration}
      aspirationDelta={settings.aspirationDelta}
      onChangeAspirationDelta={settings.setAspirationDelta}
      setsCount={settings.setsCount}
      onChangeSetsCount={settings.setSetsCount}
      p1={{
        title: 'Jugador 1',
        depth: settings.p1Depth,
        onChangeDepth: settings.setP1Depth,
        timeMode: settings.p1Mode,
        onChangeTimeMode: settings.setP1Mode,
        timeSeconds: settings.p1Secs,
        onChangeTimeSeconds: settings.setP1Secs,
      }}
      p2={{
        title: 'Jugador 2',
        depth: settings.p2Depth,
        onChangeDepth: settings.setP2Depth,
        timeMode: settings.p2Mode,
        onChangeTimeMode: settings.setP2Mode,
        timeSeconds: settings.p2Secs,
        onChangeTimeSeconds: settings.setP2Secs,
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
