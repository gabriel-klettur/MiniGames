import { useEffect, useMemo, useState } from 'react';
import { readAdvancedCfg, writeAdvancedCfg, clearAdvancedCfg, DEFAULTS } from '../../../../../utils/iaAdvancedStorage.ts';
import { DatasetTabs } from './DatasetTabs.tsx';
import { DifficultyTime } from './DifficultyTime.tsx';
import { SimulationLimits } from './SimulationLimits.tsx';
import { StartSettings } from './StartSettings.tsx';
import { MirrorAndBook } from './MirrorAndBook.tsx';
import { RepetitionSettings } from './RepetitionSettings.tsx';
import { AntiStallSettings } from './AntiStallSettings.tsx';
import { PersistenceSettings } from './PersistenceSettings.tsx';
import { ActionsBar } from './ActionsBar.tsx';

export type ControlsProps = {
  depth: number;
  onDepthChange: (d: number) => void;

  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;

  pliesLimit: number;
  onPliesLimitChange: (v: number) => void;
  gamesCount: number;
  onGamesCountChange: (v: number) => void;

  mirrorBoard: boolean;
  onMirrorChange: (v: boolean) => void;

  // Book toggle used by simulations (InfoIA)
  useBook: boolean;
  onUseBookChange: (v: boolean) => void;

  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;

  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportBook: () => void;
  // onExportBookWith?: (opts: { difficulty: 'facil' | 'medio' | 'dificil'; phase: 'aperturas' | 'medio' | 'cierres'; minSupportPct?: number }) => void;
  onPublishBooks?: (minSupportPct: number) => void;
  onClearBooks?: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;
  onResetDefaults: () => void;

  activeTableSourceId: string;
  compareSets: Array<{ id: string; name: string; color: string }>;
  onSelectTableSource: (id: string) => void;
  canClearLocal: boolean;
};

export default function Controls(props: ControlsProps) {
  // Layout and spacing handled via CSS classes in styles/infoia.css

  // Start settings (shared storage with IAPanel advanced config)
  const init = useMemo(() => readAdvancedCfg(), []);
  const [startRandom, setStartRandom] = useState<boolean>(init.startRandomFirstMove ?? false);
  const [seedInput, setSeedInput] = useState<string>(
    (init.startSeed === null || typeof init.startSeed === 'undefined') ? '' : String(init.startSeed)
  );
  const [repeatMax, setRepeatMax] = useState<number>(init.repeatMax ?? 3);
  const [avoidPenalty, setAvoidPenalty] = useState<number>(init.avoidPenalty ?? 50);
  const [noveltyBonus, setNoveltyBonus] = useState<number>(init.noveltyBonus ?? 5);
  const [rootTopK, setRootTopK] = useState<number>(init.rootTopK ?? 3);
  const [rootJitter, setRootJitter] = useState<boolean>(init.rootJitter ?? true);
  const [rootJitterProb, setRootJitterProb] = useState<number>(init.rootJitterProb ?? 0.1);
  const [rootLMR, setRootLMR] = useState<boolean>(init.rootLMR ?? true);
  const [drawBias, setDrawBias] = useState<number>(init.drawBias ?? 5);
  const [timeRiskEnabled, setTimeRiskEnabled] = useState<boolean>(init.timeRiskEnabled ?? true);
  const [noProgressLimit, setNoProgressLimit] = useState<number>(init.noProgressLimit ?? 40);
  const [avoidStepFactor, setAvoidStepFactor] = useState<number>(init.avoidStepFactor ?? 0.5);
  const [persistAntiLoopsEnabled, setPersistAntiLoopsEnabled] = useState<boolean>(init.persistAntiLoopsEnabled ?? true);
  const [halfLifeDays, setHalfLifeDays] = useState<number>(init.halfLifeDays ?? 7);
  const [persistCap, setPersistCap] = useState<number>(init.persistCap ?? 300);

  // Persist on change
  useEffect(() => {
    writeAdvancedCfg({ startRandomFirstMove: startRandom });
  }, [startRandom]);
  useEffect(() => {
    if (seedInput === '') {
      writeAdvancedCfg({ startSeed: null });
    } else {
      const n = Number(seedInput);
      if (Number.isFinite(n)) writeAdvancedCfg({ startSeed: Math.floor(n) });
    }
  }, [seedInput]);
  useEffect(() => {
    const v = Math.max(1, Math.min(10, Math.floor(repeatMax)));
    setRepeatMax(v);
    writeAdvancedCfg({ repeatMax: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatMax]);
  useEffect(() => {
    const v = Math.max(0, Math.min(500, Math.floor(avoidPenalty)));
    setAvoidPenalty(v);
    writeAdvancedCfg({ avoidPenalty: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidPenalty]);
  useEffect(() => {
    const v = Math.max(0, Math.floor(noveltyBonus));
    setNoveltyBonus(v);
    writeAdvancedCfg({ noveltyBonus: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noveltyBonus]);
  useEffect(() => {
    const v = Math.max(2, Math.min(8, Math.floor(rootTopK)));
    setRootTopK(v);
    writeAdvancedCfg({ rootTopK: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootTopK]);
  useEffect(() => {
    writeAdvancedCfg({ rootJitter });
  }, [rootJitter]);
  useEffect(() => {
    const p = Math.max(0, Math.min(1, Number(rootJitterProb)));
    setRootJitterProb(p);
    writeAdvancedCfg({ rootJitterProb: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootJitterProb]);
  useEffect(() => {
    writeAdvancedCfg({ rootLMR });
  }, [rootLMR]);
  useEffect(() => {
    const b = Math.max(0, Math.floor(drawBias));
    setDrawBias(b);
    writeAdvancedCfg({ drawBias: b });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawBias]);
  useEffect(() => { writeAdvancedCfg({ timeRiskEnabled }); }, [timeRiskEnabled]);
  useEffect(() => {
    const v = Math.max(10, Math.min(400, Math.floor(noProgressLimit)));
    setNoProgressLimit(v);
    writeAdvancedCfg({ noProgressLimit: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noProgressLimit]);
  useEffect(() => {
    const f = Math.max(0, Math.min(2, Number(avoidStepFactor)));
    setAvoidStepFactor(f);
    writeAdvancedCfg({ avoidStepFactor: f });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidStepFactor]);
  useEffect(() => { writeAdvancedCfg({ persistAntiLoopsEnabled }); }, [persistAntiLoopsEnabled]);
  useEffect(() => {
    const d = Math.max(1, Math.min(90, Math.floor(halfLifeDays)));
    setHalfLifeDays(d);
    writeAdvancedCfg({ halfLifeDays: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halfLifeDays]);
  useEffect(() => {
    const c = Math.max(50, Math.min(2000, Math.floor(persistCap)));
    setPersistCap(c);
    writeAdvancedCfg({ persistCap: c });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistCap]);

  return (
    <div className="row infoia__controls">
      {/* Dificultad / Tiempo */}
      <DifficultyTime
        depth={props.depth}
        onDepthChange={props.onDepthChange}
        timeMode={props.timeMode}
        onTimeModeChange={props.onTimeModeChange}
        timeSeconds={props.timeSeconds}
        onTimeSecondsChange={props.onTimeSecondsChange}
      />

      {/* Selector de tabla: Local o archivos agregados */}
      <label className="label">Tabla</label>
      <DatasetTabs
        activeId={props.activeTableSourceId}
        sets={props.compareSets}
        onSelect={props.onSelectTableSource}
      />

      {/* Límites de simulación */}
      <SimulationLimits
        pliesLimit={props.pliesLimit}
        onPliesLimitChange={props.onPliesLimitChange}
        gamesCount={props.gamesCount}
        onGamesCountChange={props.onGamesCountChange}
      />

      {/* Inicio aleatorio y semilla */}
      <StartSettings
        startRandom={startRandom}
        onStartRandomChange={setStartRandom}
        seedInput={seedInput}
        onSeedInputChange={setSeedInput}
      />

      {/* Visualización y uso de books */}
      <MirrorAndBook
        mirrorBoard={props.mirrorBoard}
        onMirrorChange={props.onMirrorChange}
        useBook={props.useBook}
        onUseBookChange={props.onUseBookChange}
      />

      {/* Repetición y penalización raíz */}
      <RepetitionSettings
        repeatMax={repeatMax}
        onRepeatMaxChange={setRepeatMax}
        avoidPenalty={avoidPenalty}
        onAvoidPenaltyChange={setAvoidPenalty}
      />

      {/* Anti-estancamiento */}
      <AntiStallSettings
        noveltyBonus={noveltyBonus}
        onNoveltyBonusChange={setNoveltyBonus}
        rootTopK={rootTopK}
        onRootTopKChange={setRootTopK}
        rootJitter={rootJitter}
        onRootJitterChange={setRootJitter}
        rootJitterProb={rootJitterProb}
        onRootJitterProbChange={setRootJitterProb}
        rootLMR={rootLMR}
        onRootLMRChange={setRootLMR}
        drawBias={drawBias}
        onDrawBiasChange={setDrawBias}
        timeRiskEnabled={timeRiskEnabled}
        onTimeRiskEnabledChange={setTimeRiskEnabled}
      />

      {/* Persistencia anti-bucles y límites */}
      <PersistenceSettings
        noProgressLimit={noProgressLimit}
        onNoProgressLimitChange={setNoProgressLimit}
        avoidStepFactor={avoidStepFactor}
        onAvoidStepFactorChange={setAvoidStepFactor}
        persistAntiLoopsEnabled={persistAntiLoopsEnabled}
        onPersistAntiLoopsEnabledChange={setPersistAntiLoopsEnabled}
        halfLifeDays={halfLifeDays}
        onHalfLifeDaysChange={setHalfLifeDays}
        persistCap={persistCap}
        onPersistCapChange={setPersistCap}
      />

      {/* Acciones */}
      <ActionsBar
        running={props.running}
        loading={props.loading}
        onStart={props.onStart}
        onStop={props.onStop}
        onDefault={() => {
          clearAdvancedCfg();
          setStartRandom(DEFAULTS.startRandomFirstMove);
          setSeedInput('');
          setRepeatMax(DEFAULTS.repeatMax);
          setAvoidPenalty(DEFAULTS.avoidPenalty);
          setNoveltyBonus(DEFAULTS.noveltyBonus);
          setRootTopK(DEFAULTS.rootTopK);
          setRootJitter(DEFAULTS.rootJitter);
          setRootJitterProb(DEFAULTS.rootJitterProb);
          setRootLMR(DEFAULTS.rootLMR);
          setDrawBias(DEFAULTS.drawBias);
          setTimeRiskEnabled(DEFAULTS.timeRiskEnabled);
          setNoProgressLimit(DEFAULTS.noProgressLimit);
          setAvoidStepFactor(DEFAULTS.avoidStepFactor);
          setPersistAntiLoopsEnabled(DEFAULTS.persistAntiLoopsEnabled);
          setHalfLifeDays(DEFAULTS.halfLifeDays);
          setPersistCap(DEFAULTS.persistCap);
          props.onResetDefaults();
        }}
        onExportJSON={props.onExportJSON}
        onExportCSV={props.onExportCSV}
        onExportBook={props.onExportBook}
        onPublishBooks={props.onPublishBooks}
        onClearBooks={props.onClearBooks}
        onAddCompare={props.onAddCompare}
        onClearAll={props.onClearAll}
        canClearLocal={props.canClearLocal}
        activeTableSourceId={props.activeTableSourceId}
      />
    </div>
  );
}
