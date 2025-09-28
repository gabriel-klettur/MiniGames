import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

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

const STORAGE_KEY = 'pylos.ia.advanced.v1';

function readAdvancedCfg(): {
  startRandomFirstMove?: boolean;
  startSeed?: number | null;
  repeatMax?: number;
  avoidPenalty?: number;
  noveltyBonus?: number;
  rootTopK?: number;
  rootJitter?: boolean;
  rootJitterProb?: number;
  rootLMR?: boolean;
  drawBias?: number;
  timeRiskEnabled?: boolean;
  noProgressLimit?: number;
  avoidStepFactor?: number;
  persistAntiLoopsEnabled?: boolean;
  halfLifeDays?: number;
  persistCap?: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const startRandomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : undefined;
    const startSeed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : null;
    const repeatMax = Number.isFinite(p?.repeatMax) ? Math.max(1, Math.min(10, Math.floor(p.repeatMax))) : undefined;
    const avoidPenalty = Number.isFinite(p?.avoidPenalty) ? Math.max(0, Math.min(500, Math.floor(p.avoidPenalty))) : undefined;
    const noveltyBonus = Number.isFinite(p?.noveltyBonus) ? Math.max(0, Math.floor(p.noveltyBonus)) : undefined;
    const rootTopK = Number.isFinite(p?.rootTopK) ? Math.max(2, Math.min(8, Math.floor(p.rootTopK))) : undefined;
    const rootJitter = typeof p?.rootJitter === 'boolean' ? !!p.rootJitter : undefined;
    const rootJitterProb = Number.isFinite(p?.rootJitterProb) ? Math.max(0, Math.min(1, Number(p.rootJitterProb))) : undefined;
    const rootLMR = typeof p?.rootLMR === 'boolean' ? !!p.rootLMR : undefined;
    const drawBias = Number.isFinite(p?.drawBias) ? Math.max(0, Math.floor(p.drawBias)) : undefined;
    const timeRiskEnabled = typeof p?.timeRiskEnabled === 'boolean' ? !!p.timeRiskEnabled : undefined;
    const noProgressLimit = Number.isFinite(p?.noProgressLimit) ? Math.max(10, Math.min(400, Math.floor(p.noProgressLimit))) : undefined;
    const avoidStepFactor = Number.isFinite(p?.avoidStepFactor) ? Math.max(0, Math.min(2, Number(p.avoidStepFactor))) : undefined;
    const persistAntiLoopsEnabled = typeof p?.persistAntiLoopsEnabled === 'boolean' ? !!p.persistAntiLoopsEnabled : undefined;
    const halfLifeDays = Number.isFinite(p?.halfLifeDays) ? Math.max(1, Math.min(90, Math.floor(p.halfLifeDays))) : undefined;
    const persistCap = Number.isFinite(p?.persistCap) ? Math.max(50, Math.min(2000, Math.floor(p.persistCap))) : undefined;
    return { startRandomFirstMove, startSeed, repeatMax, avoidPenalty, noveltyBonus, rootTopK, rootJitter, rootJitterProb, rootLMR, drawBias, timeRiskEnabled, noProgressLimit, avoidStepFactor, persistAntiLoopsEnabled, halfLifeDays, persistCap };
  } catch {
    return {};
  }
}

function writeAdvancedCfg(patch: Partial<{ startRandomFirstMove: boolean; startSeed: number | null; repeatMax: number; avoidPenalty: number; noveltyBonus: number; rootTopK: number; rootJitter: boolean; rootJitterProb: number; rootLMR: boolean; drawBias: number; timeRiskEnabled: boolean; noProgressLimit: number; avoidStepFactor: number; persistAntiLoopsEnabled: boolean; halfLifeDays: number; persistCap: number }>): void {
  try {
    const prev = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    })();
    const next = { ...prev, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export default function Controls(props: ControlsProps) {
  const rowStyle: CSSProperties = { gap: 12, alignItems: 'center', flexWrap: 'wrap' };
  const actionsStyle: CSSProperties = { display: 'inline-flex', gap: 8, marginLeft: 'auto' };

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
    <div className="row infoia__controls" style={rowStyle}>
      <label className="label" htmlFor="infoia-depth">Dificultad</label>
      <select id="infoia-depth" value={props.depth} onChange={(e) => props.onDepthChange(Number(e.target.value))}>
        {[1,2,3,4,5,6,7,8,9,10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Selector de tabla: Local o archivos agregados */}
      <label className="label">Tabla</label>
      <div className="segmented" role="tablist" aria-label="Seleccionar dataset para la tabla">
        <button
          className={props.activeTableSourceId === 'local' ? 'active' : ''}
          role="tab"
          aria-selected={props.activeTableSourceId === 'local'}
          onClick={() => props.onSelectTableSource('local')}
          title="Mostrar datos locales"
        >Local</button>
        {props.compareSets.map((s) => (
          <button
            key={s.id}
            className={props.activeTableSourceId === s.id ? 'active' : ''}
            role="tab"
            aria-selected={props.activeTableSourceId === s.id}
            onClick={() => props.onSelectTableSource(s.id)}
            title={s.name}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
            <span className="ellipsis" style={{ maxWidth: 160 }}>{s.name}</span>
          </button>
        ))}
      </div>

      <label className="label">Tiempo</label>
      <div className="segmented" role="group" aria-label="Modo de tiempo de simulación">
        <button className={props.timeMode === 'auto' ? 'active' : ''} onClick={() => props.onTimeModeChange('auto')} aria-pressed={props.timeMode === 'auto'}>Auto</button>
        <button className={props.timeMode === 'manual' ? 'active' : ''} onClick={() => props.onTimeModeChange('manual')} aria-pressed={props.timeMode === 'manual'}>Manual</button>
      </div>
      {props.timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label="Selector de tiempo manual">
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={props.timeSeconds}
            onChange={(e) => props.onTimeSecondsChange(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={props.timeSeconds}
          />
          <span className="range-value badge">{props.timeSeconds.toFixed(1)} s</span>
        </div>
      )}

      <label className="label" htmlFor="infoia-plies">Límite jugadas</label>
      <input id="infoia-plies" className="field-num" type="number" min={1} max={400} value={props.pliesLimit} onChange={(e) => props.onPliesLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-count">Partidas</label>
      <input id="infoia-count" className="field-num" type="number" min={1} max={1000} value={props.gamesCount} onChange={(e) => props.onGamesCountChange(Number(e.target.value))} style={{ width: 90 }} />

      {/* Inicio: movimiento inicial aleatorio y semilla (persisten en la misma config que IAPanel) */}
      <label className="label" htmlFor="infoia-start-rand" title="Realizar el primer movimiento al azar si el tablero está vacío">Inicio</label>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <input
          id="infoia-start-rand"
          type="checkbox"
          checked={startRandom}
          onChange={(e) => setStartRandom(e.target.checked)}
          aria-checked={startRandom}
          title="Movimiento inicial aleatorio"
        />
        <label htmlFor="infoia-start-rand">Movimiento inicial aleatorio</label>
        <label className="label" htmlFor="infoia-start-seed" style={{ marginLeft: 8 }}>Semilla</label>
        <input
          id="infoia-start-seed"
          className="field-num"
          type="number"
          placeholder="p. ej., 1234"
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value)}
          style={{ width: 120 }}
          disabled={!startRandom}
          title="Semilla para reproducibilidad (opcional)"
        />
      </div>

      {/* Visualizar simulación en el tablero (sin animaciones) */}
      <label className="label" htmlFor="infoia-mirror" title="Mostrar la partida simulada en el tablero (sin animaciones)">Visualizar</label>
      <input
        id="infoia-mirror"
        type="checkbox"
        checked={props.mirrorBoard}
        onChange={(e) => props.onMirrorChange(e.target.checked)}
        aria-checked={props.mirrorBoard}
        title="Mostrar la partida simulada en el tablero (sin animaciones)"
      />

      {/* Usar libro de aperturas en simulaciones */}
      <label className="label" htmlFor="infoia-usebook" title="Usar libro de aperturas (si existe) durante la simulación">Utilizar books</label>
      <input
        id="infoia-usebook"
        type="checkbox"
        checked={props.useBook}
        onChange={(e) => props.onUseBookChange(e.target.checked)}
        aria-checked={props.useBook}
        title="Activar/desactivar uso de book en InfoIA"
      />

      {/* Límite de repetición de posiciones (para cortar bucles) */}
      <label className="label" htmlFor="infoia-repeatmax" title="Umbral para detener una simulación cuando se repite una posición tantas veces">Repetición máx.</label>
      <input
        id="infoia-repeatmax"
        className="field-num"
        type="number"
        min={1}
        max={10}
        value={repeatMax}
        onChange={(e) => setRepeatMax(Number(e.target.value))}
        style={{ width: 90 }}
        title="Umbral de repetición (1–10). Al alcanzarse, la simulación finaliza con motivo 'repetition-limit'."
      />

      {/* Penalización para evitar repetir posiciones en la raíz de la búsqueda */}
      <label className="label" htmlFor="infoia-avoidpen" title="Penalización aplicada a movimientos raíz que llevan a posiciones repetidas">Evitar bucles (penalización)</label>
      <input
        id="infoia-avoidpen"
        className="field-num"
        type="number"
        min={0}
        max={500}
        value={avoidPenalty}
        onChange={(e) => setAvoidPenalty(Number(e.target.value))}
        style={{ width: 110 }}
        title="Penalización [0–500] en unidades de evaluación. Valores mayores desincentivan ciclos."
      />

      {/* Anti-estancamiento: bonus de novedad, Top-K, jitter, LMR y sesgo de tablas */}
      <label className="label" htmlFor="infoia-novbonus" title="Pequeño bonus a estados no vistos para diversificar">Bonus novedad</label>
      <input id="infoia-novbonus" className="field-num" type="number" min={0} max={50} value={noveltyBonus} onChange={(e) => setNoveltyBonus(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-topk" title="Líneas raíz candidatas para muestreo epsilon-greedy">Top-K</label>
      <input id="infoia-topk" className="field-num" type="number" min={2} max={8} value={rootTopK} onChange={(e) => setRootTopK(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-jitter" title="Añadir jitter seedable al orden de raíz cuando hay repetición">Jitter raíz</label>
      <input id="infoia-jitter" type="checkbox" checked={rootJitter} onChange={(e) => setRootJitter(e.target.checked)} aria-checked={rootJitter} />

      <label className="label" htmlFor="infoia-jprob" title="Probabilidad de intercambio vecino-vecino en el orden de raíz">Prob. jitter</label>
      <input id="infoia-jprob" className="field-num" type="number" min={0} max={1} step={0.01} value={rootJitterProb} onChange={(e) => setRootJitterProb(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-lmr" title="Reducir más la profundidad en movimientos repetitivos en la raíz">LMR raíz</label>
      <input id="infoia-lmr" type="checkbox" checked={rootLMR} onChange={(e) => setRootLMR(e.target.checked)} aria-checked={rootLMR} />

      <label className="label" htmlFor="infoia-drawbias" title="Penalización ligera a ciclos (tablas peor que 0) para no preferirlos">Sesgo tablas</label>
      <input id="infoia-drawbias" className="field-num" type="number" min={0} max={50} value={drawBias} onChange={(e) => setDrawBias(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-timerisk" title="Aumentar presupuesto de tiempo bajo riesgo de repetición">Tiempo sensible al riesgo</label>
      <input id="infoia-timerisk" type="checkbox" checked={timeRiskEnabled} onChange={(e) => setTimeRiskEnabled(e.target.checked)} aria-checked={timeRiskEnabled} />

      <label className="label" htmlFor="infoia-noprog" title="Cortar simulación si no hay progreso en N plies">Sin progreso (plies)</label>
      <input id="infoia-noprog" className="field-num" type="number" min={10} max={400} value={noProgressLimit} onChange={(e) => setNoProgressLimit(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-avoidstep" title="Factor de incremento de penalización ponderada (0..2)">Factor penalización</label>
      <input id="infoia-avoidstep" className="field-num" type="number" min={0} max={2} step={0.1} value={avoidStepFactor} onChange={(e) => setAvoidStepFactor(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-persist" title="Persistir claves de anti-bucle entre sesiones">Persistir anti-bucles</label>
      <input id="infoia-persist" type="checkbox" checked={persistAntiLoopsEnabled} onChange={(e) => setPersistAntiLoopsEnabled(e.target.checked)} aria-checked={persistAntiLoopsEnabled} />

      <label className="label" htmlFor="infoia-halflife" title="Semivida en días para decaimiento de pesos persistidos">Semivida (días)</label>
      <input id="infoia-halflife" className="field-num" type="number" min={1} max={90} value={halfLifeDays} onChange={(e) => setHalfLifeDays(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-cap" title="Límite de entradas persistidas">Cap persistencia</label>
      <input id="infoia-cap" className="field-num" type="number" min={50} max={2000} value={persistCap} onChange={(e) => setPersistCap(Number(e.target.value))} style={{ width: 100 }} />

      <div className="infoia__actions" style={actionsStyle}>
        {!props.running ? (
          <button className="primary" onClick={props.onStart} disabled={props.loading} title="Iniciar simulaciones">Iniciar</button>
        ) : (
          <button className="btn-stop" onClick={props.onStop} title="Detener simulación en curso">Detener</button>
        )}
        <button
          className="btn-accent"
          onClick={() => {
            // Clear advanced storage and reset local advanced state to defaults
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            // Defaults aligned with initializers above
            setStartRandom(false);
            setSeedInput('');
            setRepeatMax(3);
            setAvoidPenalty(50);
            setNoveltyBonus(5);
            setRootTopK(3);
            setRootJitter(true);
            setRootJitterProb(0.1);
            setRootLMR(true);
            setDrawBias(5);
            setTimeRiskEnabled(true);
            setNoProgressLimit(40);
            setAvoidStepFactor(0.5);
            setPersistAntiLoopsEnabled(true);
            setHalfLifeDays(7);
            setPersistCap(300);
            // Ask parent to reset top-level InfoIA controls and clear its storage
            props.onResetDefaults();
          }}
          title="Restablecer todos los parámetros a valores por defecto"
          disabled={props.running}
        >Default</button>
        <button className="btn-ghost" onClick={props.onExportJSON}>Exportar JSON</button>
        <button className="btn-ghost" onClick={props.onExportCSV}>Exportar CSV</button>
        <button className="btn-ghost" onClick={props.onExportBook} title="Generar libro de aperturas (book.json) a partir de las simulaciones">Exportar Book</button>
        {import.meta.env.DEV && (
          <>
            <label className="label" htmlFor="infoia-publish-support" title="Soporte mínimo para incluir jugadas en el book (0–100%)">Soporte (%)</label>
            <input id="infoia-publish-support" className="field-num" type="number" min={0} max={100} defaultValue={55} style={{ width: 80 }} />
            <button
              className="btn-accent"
              onClick={() => {
                const el = document.getElementById('infoia-publish-support') as HTMLInputElement | null;
                const val = el ? Number(el.value) : 55;
                const pct = Number.isFinite(val) ? Math.max(0, Math.min(100, Math.floor(val))) : 55;
                props.onPublishBooks?.(pct);
              }}
              title="Publicar todos los books en public/books (dev)"
            >Publicar Books</button>
            <button className="btn-warning" onClick={props.onClearBooks} title="Vaciar la carpeta public/books (dev)">Vaciar Books</button>
          </>
        )}
        <button className="btn-ghost" onClick={props.onAddCompare} title="Agregar CSV o JSON">Agregar CSV o JSON</button>
        <button className="btn-danger" onClick={props.onClearAll} disabled={!props.canClearLocal} title={props.activeTableSourceId !== 'local' ? 'Solo disponible para datos locales' : 'Borrar todos los registros locales'}>Borrar todo</button>
      </div>
    </div>
  );
}
