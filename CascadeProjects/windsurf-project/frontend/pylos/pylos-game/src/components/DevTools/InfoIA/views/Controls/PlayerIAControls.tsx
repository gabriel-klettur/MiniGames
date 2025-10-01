import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULTS,
  readAdvancedCfgByPlayer,
  writeAdvancedCfgByPlayer,
  type PlayerId,
} from '../../../../../utils/iaAdvancedStorage';
import { StartSettings } from './StartSettings';
import { RepetitionSettings } from './RepetitionSettings';
import { AntiStallSettings } from './AntiStallSettings';
import { PersistenceSettings } from './PersistenceSettings';
import { DifficultyTime } from './DifficultyTime';
import { HeuristicSettings } from './HeuristicSettings';

export type PlayerIAControlsProps = {
  player: PlayerId; // 'L' | 'D'
  title: string;
  themeClass: string; // e.g., 'infoia__player--light' | 'infoia__player--dark'
  ballIconSrc: string;
  ballAlt: string;
  // Shared collapsible state (synced across players)
  cardCollapsed: Record<'difficulty' | 'start' | 'repetition' | 'persistence' | 'antiStall' | 'heuristic', boolean>;
  onToggleCard: (id: 'difficulty' | 'start' | 'repetition' | 'persistence' | 'antiStall' | 'heuristic') => void;
};

export default function PlayerIAControls(props: PlayerIAControlsProps) {
  const { player, title, themeClass, ballIconSrc, ballAlt } = props;

  // Initialize from player-scoped storage
  const init = useMemo(() => readAdvancedCfgByPlayer(player), [player]);

  // Difficulty & Time (per-player)
  const [depth, setDepth] = useState<number>(init.depth ?? 3);
  const [timeMode, setTimeMode] = useState<'auto' | 'manual'>(init.timeMode ?? 'auto');
  const [timeSeconds, setTimeSeconds] = useState<number>(init.timeSeconds ?? 8);

  const [startRandom, setStartRandom] = useState<boolean>(
    init.startRandomFirstMove ?? DEFAULTS.startRandomFirstMove
  );
  const [seedInput, setSeedInput] = useState<string>(
    init.startSeed === null || typeof init.startSeed === 'undefined'
      ? ''
      : String(init.startSeed)
  );
  // New: per-player early random turns N
  const [earlyRandom, setEarlyRandom] = useState<number>(
    Number.isFinite(init.startEarlyRandom as number) ? Math.max(0, Math.min(10, Math.floor(Number(init.startEarlyRandom)))) : 2
  );
  const [repeatMax, setRepeatMax] = useState<number>(init.repeatMax ?? DEFAULTS.repeatMax);
  const [avoidPenalty, setAvoidPenalty] = useState<number>(init.avoidPenalty ?? DEFAULTS.avoidPenalty);
  const [noveltyBonus, setNoveltyBonus] = useState<number>(init.noveltyBonus ?? DEFAULTS.noveltyBonus);
  const [rootTopK, setRootTopK] = useState<number>(init.rootTopK ?? DEFAULTS.rootTopK);
  const [rootJitter, setRootJitter] = useState<boolean>(init.rootJitter ?? DEFAULTS.rootJitter);
  const [rootJitterProb, setRootJitterProb] = useState<number>(init.rootJitterProb ?? DEFAULTS.rootJitterProb);
  const [rootLMR, setRootLMR] = useState<boolean>(init.rootLMR ?? DEFAULTS.rootLMR);
  const [drawBias, setDrawBias] = useState<number>(init.drawBias ?? DEFAULTS.drawBias);
  // New: per-player bitboards toggle (default true if not set)
  const [bitboardsEnabled, setBitboardsEnabled] = useState<boolean>(
    typeof init.bitboardsEnabled === 'boolean' ? !!init.bitboardsEnabled : true
  );
  const [timeRiskEnabled, setTimeRiskEnabled] = useState<boolean>(init.timeRiskEnabled ?? DEFAULTS.timeRiskEnabled);
  const [noProgressLimit, setNoProgressLimit] = useState<number>(init.noProgressLimit ?? DEFAULTS.noProgressLimit);
  const [avoidStepFactor, setAvoidStepFactor] = useState<number>(init.avoidStepFactor ?? DEFAULTS.avoidStepFactor);
  const [persistAntiLoopsEnabled, setPersistAntiLoopsEnabled] = useState<boolean>(
    init.persistAntiLoopsEnabled ?? DEFAULTS.persistAntiLoopsEnabled
  );
  const [halfLifeDays, setHalfLifeDays] = useState<number>(init.halfLifeDays ?? DEFAULTS.halfLifeDays);
  const [persistCap, setPersistCap] = useState<number>(init.persistCap ?? DEFAULTS.persistCap);
  // New: per-player book/diversify/epsilon/tieDelta/workers
  const [bookEnabled, setBookEnabled] = useState<boolean>(
    typeof init.bookEnabled === 'boolean' ? !!init.bookEnabled : false
  );
  const [diversify, setDiversify] = useState<'off' | 'epsilon' | 'adaptive'>(init.diversify ?? DEFAULTS.diversify);
  const [epsilon, setEpsilon] = useState<number>(
    Number.isFinite(init.epsilon as number) ? Number(init.epsilon) : DEFAULTS.epsilon
  );
  const [tieDelta, setTieDelta] = useState<number>(
    Number.isFinite(init.tieDelta as number) ? Math.floor(Number(init.tieDelta)) : DEFAULTS.tieDelta
  );
  const [workers, setWorkers] = useState<'auto' | number>(
    (init.workers === 'auto' || Number.isFinite(init.workers as number)) ? (init.workers as any) : 'auto'
  );

  // Persist to player-scoped storage when changing
  useEffect(() => { writeAdvancedCfgByPlayer(player, { depth }); }, [player, depth]);
  useEffect(() => { writeAdvancedCfgByPlayer(player, { timeMode }); }, [player, timeMode]);
  useEffect(() => {
    const v = Math.max(1, Math.min(60, Math.floor(timeSeconds)));
    setTimeSeconds(v);
    writeAdvancedCfgByPlayer(player, { timeSeconds: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSeconds, player]);

  useEffect(() => {
    writeAdvancedCfgByPlayer(player, { startRandomFirstMove: startRandom });
  }, [player, startRandom]);

  useEffect(() => {
    if (seedInput === '') {
      writeAdvancedCfgByPlayer(player, { startSeed: null });
    } else {
      const n = Number(seedInput);
      if (Number.isFinite(n)) writeAdvancedCfgByPlayer(player, { startSeed: Math.floor(n) });
    }
  }, [player, seedInput]);

  // Persist early-random N per player
  useEffect(() => {
    const v = Math.max(0, Math.min(10, Math.floor(earlyRandom)));
    setEarlyRandom(v);
    writeAdvancedCfgByPlayer(player, { startEarlyRandom: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earlyRandom, player]);

  useEffect(() => {
    const v = Math.max(1, Math.min(10, Math.floor(repeatMax)));
    setRepeatMax(v);
    writeAdvancedCfgByPlayer(player, { repeatMax: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatMax, player]);

  useEffect(() => {
    const v = Math.max(0, Math.min(500, Math.floor(avoidPenalty)));
    setAvoidPenalty(v);
    writeAdvancedCfgByPlayer(player, { avoidPenalty: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidPenalty, player]);

  useEffect(() => {
    const v = Math.max(0, Math.floor(noveltyBonus));
    setNoveltyBonus(v);
    writeAdvancedCfgByPlayer(player, { noveltyBonus: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noveltyBonus, player]);

  useEffect(() => {
    const v = Math.max(1, Math.min(8, Math.floor(rootTopK)));
    setRootTopK(v);
    writeAdvancedCfgByPlayer(player, { rootTopK: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootTopK, player]);

  useEffect(() => { writeAdvancedCfgByPlayer(player, { rootJitter }); }, [player, rootJitter]);

  useEffect(() => {
    const p = Math.max(0, Math.min(1, Number(rootJitterProb)));
    setRootJitterProb(p);
    writeAdvancedCfgByPlayer(player, { rootJitterProb: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootJitterProb, player]);

  useEffect(() => { writeAdvancedCfgByPlayer(player, { rootLMR }); }, [player, rootLMR]);

  useEffect(() => {
    const b = Math.max(0, Math.floor(drawBias));
    setDrawBias(b);
    writeAdvancedCfgByPlayer(player, { drawBias: b });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawBias, player]);

  // Persist bitboards toggle per player
  useEffect(() => {
    writeAdvancedCfgByPlayer(player, { bitboardsEnabled });
  }, [player, bitboardsEnabled]);

  useEffect(() => { writeAdvancedCfgByPlayer(player, { timeRiskEnabled }); }, [player, timeRiskEnabled]);
  // Persist new fields
  useEffect(() => { writeAdvancedCfgByPlayer(player, { bookEnabled }); }, [player, bookEnabled]);
  useEffect(() => {
    const m = (diversify === 'off' || diversify === 'epsilon' || diversify === 'adaptive') ? diversify : DEFAULTS.diversify;
    setDiversify(m);
    writeAdvancedCfgByPlayer(player, { diversify: m });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diversify, player]);
  useEffect(() => {
    const e = Math.max(0, Math.min(1, Number(epsilon)));
    setEpsilon(e);
    writeAdvancedCfgByPlayer(player, { epsilon: e });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epsilon, player]);
  useEffect(() => {
    const t = Math.max(0, Math.min(100, Math.floor(tieDelta)));
    setTieDelta(t);
    writeAdvancedCfgByPlayer(player, { tieDelta: t });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tieDelta, player]);
  useEffect(() => {
    const w = (workers === 'auto' || Number.isFinite(workers as number)) ? workers : 'auto';
    writeAdvancedCfgByPlayer(player, { workers: w as any });
  }, [player, workers]);

  useEffect(() => {
    const v = Math.max(10, Math.min(400, Math.floor(noProgressLimit)));
    setNoProgressLimit(v);
    writeAdvancedCfgByPlayer(player, { noProgressLimit: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noProgressLimit, player]);

  useEffect(() => {
    const f = Math.max(0, Math.min(2, Number(avoidStepFactor)));
    setAvoidStepFactor(f);
    writeAdvancedCfgByPlayer(player, { avoidStepFactor: f });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidStepFactor, player]);

  useEffect(() => { writeAdvancedCfgByPlayer(player, { persistAntiLoopsEnabled }); }, [player, persistAntiLoopsEnabled]);

  useEffect(() => {
    const d = Math.max(1, Math.min(90, Math.floor(halfLifeDays)));
    setHalfLifeDays(d);
    writeAdvancedCfgByPlayer(player, { halfLifeDays: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halfLifeDays, player]);

  useEffect(() => {
    const c = Math.max(50, Math.min(2000, Math.floor(persistCap)));
    setPersistCap(c);
    writeAdvancedCfgByPlayer(player, { persistCap: c });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistCap, player]);

  const { cardCollapsed, onToggleCard } = props;

  const renderCardHeader = (
    id: 'difficulty' | 'start' | 'repetition' | 'persistence' | 'antiStall' | 'heuristic',
    titleText: string
  ) => (
    <div className="infoia__card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{titleText}</span>
      <button
        type="button"
        className="infoia__card-toggle"
        onClick={() => onToggleCard(id)}
        aria-expanded={!cardCollapsed[id]}
        aria-controls={`card-${player}-${id}`}
        title={cardCollapsed[id] ? 'Expandir' : 'Contraer'}
      >
        ▾
      </button>
    </div>
  );

  return (
    <section className={`infoia__player ${themeClass}`} aria-label={title}>
      <header className="infoia__player-header">
        <img src={ballIconSrc} alt={ballAlt} width={24} height={24} />
        <h4 className="infoia__player-title">{title}</h4>
      </header>

      <div className="infoia__card">
        {renderCardHeader('difficulty', 'Dificultad y tiempo')}
        {!cardCollapsed.difficulty && (
          <div className="infoia__card-body" id={`card-${player}-difficulty`}>
            <DifficultyTime
              depth={depth}
              onDepthChange={setDepth}
              timeMode={timeMode}
              onTimeModeChange={setTimeMode}
              timeSeconds={timeSeconds}
              onTimeSecondsChange={setTimeSeconds}
            />
          </div>
        )}
      </div>

      <div className="infoia__card">
        {renderCardHeader('start', 'Inicio y semilla')}
        {!cardCollapsed.start && (
          <div className="infoia__card-body" id={`card-${player}-start`}>
            <StartSettings
              startRandom={startRandom}
              onStartRandomChange={setStartRandom}
              seedInput={seedInput}
              onSeedInputChange={setSeedInput}
              bookEnabled={bookEnabled}
              onBookEnabledChange={setBookEnabled}
              earlyRandom={earlyRandom}
              onEarlyRandomChange={setEarlyRandom}
            />
          </div>
        )}
      </div>

      <div className="infoia__card">
        {renderCardHeader('heuristic', 'Heurística (búsqueda)')}
        {!cardCollapsed.heuristic && (
          <div className="infoia__card-body" id={`card-${player}-heuristic`}>
            <HeuristicSettings
              diversify={diversify}
              onDiversifyChange={setDiversify}
              epsilon={epsilon}
              onEpsilonChange={setEpsilon}
              tieDelta={tieDelta}
              onTieDeltaChange={setTieDelta}
              workers={workers}
              onWorkersChange={setWorkers}
              rootTopK={rootTopK}
              onRootTopKChange={setRootTopK}
              rootJitter={rootJitter}
              onRootJitterChange={setRootJitter}
              rootJitterProb={rootJitterProb}
              onRootJitterProbChange={setRootJitterProb}
              rootLMR={rootLMR}
              onRootLMRChange={setRootLMR}
              bitboardsEnabled={bitboardsEnabled}
              onBitboardsEnabledChange={setBitboardsEnabled}
            />
          </div>
        )}
      </div>

      <div className="infoia__card">
        {renderCardHeader('repetition', 'Repetición y penalización')}
        {!cardCollapsed.repetition && (
          <div className="infoia__card-body" id={`card-${player}-repetition`}>
            <RepetitionSettings
              repeatMax={repeatMax}
              onRepeatMaxChange={setRepeatMax}
              avoidPenalty={avoidPenalty}
              onAvoidPenaltyChange={setAvoidPenalty}
            />
          </div>
        )}
      </div>

      <div className="infoia__card">
        {renderCardHeader('persistence', 'Persistencia y límites')}
        {!cardCollapsed.persistence && (
          <div className="infoia__card-body" id={`card-${player}-persistence`}>
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
          </div>
        )}
      </div>

      <div className="infoia__card">
        {renderCardHeader('antiStall', 'Anti-estancamiento')}
        {!cardCollapsed.antiStall && (
          <div className="infoia__card-body" id={`card-${player}-antiStall`}>
            <AntiStallSettings
              noveltyBonus={noveltyBonus}
              onNoveltyBonusChange={setNoveltyBonus}
              drawBias={drawBias}
              onDrawBiasChange={setDrawBias}
              timeRiskEnabled={timeRiskEnabled}
              onTimeRiskEnabledChange={setTimeRiskEnabled}
            />
          </div>
        )}
      </div>
    </section>
  );
}
