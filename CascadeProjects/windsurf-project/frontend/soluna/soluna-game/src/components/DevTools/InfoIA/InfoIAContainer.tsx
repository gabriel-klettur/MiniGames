import React, { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import InfoIAView, { type InfoIARecord, type TimeMode, type MoveDetail } from './InfoIAView';
import { bestMove } from '../../../ia';
import type { GameState } from '../../../game/types';
import { useGame } from '../../../game/store';
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { createAIRunner } from './services/aiRunner';

/**
 * InfoIAContainer — Orquesta simulaciones IA vs IA con layout estilo Pylos.
 * Soporta límites de jugadas/partidas y exportación básica.
 */
const InfoIAContainer: React.FC = () => {
  const { state, dispatch } = useGame();

  // Tabs
  const [activeTab, setActiveTab] = useState<'repeats' | 'sim' | 'charts' | 'books'>('sim');

  // Visualización / dataset
  const [visualize, setVisualize] = useState<boolean>(true);
  const datasetLabel = 'Local';
  const vizRef = useRef<boolean>(visualize);
  useEffect(() => { vizRef.current = visualize; }, [visualize]);

  // Límites
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [setsCount, setSetsCount] = useState<number>(10);

  // Per-player controles
  const [p1Depth, setP1Depth] = useState<number>(3);
  const [p2Depth, setP2Depth] = useState<number>(3);
  const [p1Mode, setP1Mode] = useState<TimeMode>('auto');
  const [p2Mode, setP2Mode] = useState<TimeMode>('auto');
  const [p1Secs, setP1Secs] = useState<number>(3);
  const [p2Secs, setP2Secs] = useState<number>(3);

  // Ejecución
  const [running, setRunning] = useState<boolean>(false);
  const runningRef = useRef(false);
  const moveTimerRef = useRef<number | null>(null);
  const moveRafRef = useRef<number | null>(null);
  const runnerRef = useRef<ReturnType<typeof createAIRunner> | null>(null);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [moveElapsedMs, setMoveElapsedMs] = useState<number>(0);
  const [moveTargetMs, setMoveTargetMs] = useState<number | undefined>(undefined);
  const [progDepth, setProgDepth] = useState<number>(0);
  const [progNodes, setProgNodes] = useState<number>(0);
  const [progScore, setProgScore] = useState<number>(0);
  const [progNps, setProgNps] = useState<number>(0);

  // Registros
  const [records, setRecords] = useState<InfoIARecord[]>([]);
  const { compareSets, activeTableSourceId, addFilesFromFileList, removeSet, clearSets } = useCompareDatasets();
  const curDetailsRef = useRef<MoveDetail[]>([]);

  // Estado de juego actual
  const stateRef = useRef<GameState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Crear/limpiar runner una vez
  useEffect(() => {
    runnerRef.current = createAIRunner();
    return () => {
      try { runnerRef.current?.dispose(); } catch {}
      runnerRef.current = null;
    };
  }, []);

  // Persistence (records)
  const LS_KEY = 'soluna.infoia.records.v1';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InfoIARecord[];
        if (Array.isArray(parsed)) setRecords(parsed);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Evitar bloquear el hilo principal mientras la simulación corre
    if (runningRef.current) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch {}
  }, [records]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'reset-game' });
  }, [dispatch]);

  const stepOnce = useCallback((depth: number) => {
    const st = stateRef.current;
    const res = bestMove(st, depth);
    if (res.move) {
      dispatch({ type: 'select', id: (res.move as any).sourceId });
      dispatch({ type: 'attempt-merge', sourceId: (res.move as any).sourceId, targetId: (res.move as any).targetId });
    }
  }, [dispatch]);

  const stopMoveTimer = () => {
    if (moveTimerRef.current != null) {
      window.clearInterval(moveTimerRef.current);
      moveTimerRef.current = null;
    }
  };

  const stopMoveRaf = () => {
    if (moveRafRef.current != null) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }
  };

  const runSimulations = useCallback(async () => {
    runningRef.current = true;
    setRunning(true);
    // No limpiar los registros al iniciar: acumulamos resultados entre ejecuciones
    // Entrar en modo 'simulation' para evitar animaciones y bloqueos
    dispatch({ type: 'set-mode', mode: 'simulation' } as any);
    let setsPlayed = 0;
    for (let s = 0; setsPlayed < setsCount && runningRef.current; s++) {
      // Reiniciar juego (resetea estrellas) para un nuevo set
      resetGame();
      dispatch({ type: 'set-mode', mode: 'simulation' } as any);
      // Esperar a que el estado refleje el reset (evita heredar gameOver del set previo)
      const waitForReset = async (): Promise<boolean> => {
        for (let tries = 0; tries < 60 && runningRef.current; tries++) {
          await new Promise((r) => setTimeout(r, 0));
          const sNow = stateRef.current as any;
          const stars1 = sNow?.players?.[1]?.stars ?? 0;
          const stars2 = sNow?.players?.[2]?.stars ?? 0;
          if (!sNow.gameOver && !sNow.roundOver && stars1 === 0 && stars2 === 0) return true;
        }
        return false;
      };
      const ok = await waitForReset();
      if (!ok) break;
      let roundsInSet = 0;
      while (runningRef.current && !stateRef.current.gameOver) {
        curDetailsRef.current = [];
        const startedAtWall = Date.now();
        const t0 = performance.now();
        let moves = 0;
        // Helper: wait until turn flips or round ends to avoid stale-state duplicates
        const waitTurnOrEnd = async (prevPlayer: 1 | 2): Promise<boolean> => {
          for (let tries = 0; tries < 60 && runningRef.current; tries++) {
            await new Promise((r) => setTimeout(r, 0));
            const sNow = stateRef.current;
            if (sNow.roundOver || sNow.gameOver) return true; // applied and finished
            if (sNow.currentPlayer !== prevPlayer) return true; // applied and flipped
          }
          return false; // likely not applied (stale ids or rejected)
        };

        for (let p = 0; p < pliesLimit && runningRef.current; p++) {
        const stNow = stateRef.current;
        const cur = stNow.currentPlayer;
        const depth = cur === 1 ? p1Depth : p2Depth;
        const mode = cur === 1 ? p1Mode : p2Mode;
        const secs = cur === 1 ? p1Secs : p2Secs;
        const target = mode === 'manual' ? Math.max(0, Math.floor(secs * 1000)) : 0;
        setMoveIndex(p + 1);
        setMoveElapsedMs(0);
        setMoveTargetMs(target || undefined);
        setProgDepth(0); setProgNodes(0); setProgScore(0); setProgNps(0);
        stopMoveTimer();
        stopMoveRaf();
        const runner = runnerRef.current;
        try {
          // Siempre mostramos tiempo transcurrido, tanto en AUTO (sin target) como MANUAL
          const startTs = performance.now();
          if (vizRef.current) {
            const tick = () => {
              const elapsed = performance.now() - startTs;
              setMoveElapsedMs(elapsed);
              // En manual, si se alcanza target se detiene aquí; en auto continúa hasta RESULT
              if ((target === 0 || elapsed < target) && runningRef.current) {
                moveRafRef.current = requestAnimationFrame(tick);
              }
            };
            moveRafRef.current = requestAnimationFrame(tick);
          }
          let res = undefined as undefined | { bestMove?: any; elapsedMs?: number };
          if (runner) {
            try {
              res = await runner.startSearch(
                { state: stateRef.current, depth, timeMs: target || undefined },
                (p) => {
                  if (!vizRef.current) return;
                  setProgDepth(p.depth || 0);
                  setProgNodes(p.nodes || 0);
                  setProgScore(typeof p.score === 'number' ? p.score : 0);
                  const elapsed = performance.now() - startTs;
                  setProgNps(elapsed > 0 ? Math.round(((p.nodes || 0) * 1000) / elapsed) : 0);
                }
              );
            } catch {
              res = undefined;
            }
          }
          stopMoveRaf();
          setMoveElapsedMs(res?.elapsedMs ?? (target || 0));
          if (res?.bestMove) {
            const mv: any = res.bestMove;
            dispatch({ type: 'select', id: mv.sourceId });
            dispatch({ type: 'attempt-merge', sourceId: mv.sourceId, targetId: mv.targetId });
            // Esperar cambio de turno o fin de ronda para confirmar aplicación
            const applied = await waitTurnOrEnd(cur);
            if (applied) {
              const idx = curDetailsRef.current.length + 1;
              // Guardar desglose confirmado
              curDetailsRef.current.push({
                index: idx,
                elapsedMs: res?.elapsedMs ?? target ?? 0,
                depthReached: (res as any)?.depthReached,
                nodes: (res as any)?.nodes,
                nps: (res as any)?.nps,
                score: (res as any)?.score,
                bestMove: mv,
                player: cur,
                depthUsed: depth,
                applied: true,
                at: Date.now(),
              });
              moves++;
            }
          } else {
            // Fallback hilo principal cuando no hay runner o fallo de worker
            const st = stateRef.current;
            const fb = (bestMove as any)(st, depth);
            if (fb?.move) {
              dispatch({ type: 'select', id: (fb.move as any).sourceId });
              dispatch({ type: 'attempt-merge', sourceId: (fb.move as any).sourceId, targetId: (fb.move as any).targetId });
            }
            const applied = await waitTurnOrEnd(cur);
            if (applied) {
              const idx = curDetailsRef.current.length + 1;
              curDetailsRef.current.push({
                index: idx,
                elapsedMs: fb?.elapsedMs ?? target ?? 0,
                depthReached: undefined,
                nodes: fb?.nodes,
                nps: fb?.nps,
                score: fb?.score,
                bestMove: fb?.move,
                player: cur,
                depthUsed: depth,
                applied: true,
                at: Date.now(),
              });
              moves++;
            }
          }
        } catch {}
          await new Promise((r) => setTimeout(r, 0));
          const st = stateRef.current;
          if (st.roundOver || st.gameOver) break;
        }
        const stEnd = stateRef.current;
        const t1 = performance.now();
        const rec: InfoIARecord = {
          id: `${Date.now()}-${setsPlayed}-${roundsInSet}`,
          startedAt: startedAtWall,
          durationMs: t1 - t0,
          moves,
          winner: stEnd.roundOver ? (stEnd.lastMover as 1 | 2) : 0,
          p1Depth,
          p2Depth,
          setId: `set-${setsPlayed}`,
          details: curDetailsRef.current.slice(),
        };
        setRecords((prev) => [rec, ...prev]);
        roundsInSet += 1;
        // Si terminó la ronda pero no el set, iniciar nueva ronda
        if (stEnd.roundOver && !stEnd.gameOver) {
          dispatch({ type: 'new-round' });
        }
        // Pequeña espera para ceder control al UI/worker
        await new Promise((r) => setTimeout(r, 0));
        // Salvaguarda: evitar sets infinitos por empates repetidos
        if (roundsInSet > 50) break;
      }
      // Contabilizar set solo si terminó con gameOver (alguien alcanzó 4 estrellas) o si salimos tras 50 rondas
      setsPlayed += 1;
    }
    runningRef.current = false;
    setRunning(false);
    // Restaurar modo normal al finalizar
    dispatch({ type: 'set-mode', mode: 'normal' } as any);
    // Persistir registros una vez al final para evitar bloqueos durante ejecución
    try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch {}
  }, [setsCount, pliesLimit, p1Depth, p2Depth, resetGame, stepOnce, dispatch]);

  const onStart = useCallback(() => {
    if (runningRef.current) return;
    void runSimulations();
  }, [runSimulations]);

  const onStop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    stopMoveTimer();
    stopMoveRaf();
    try { runnerRef.current?.cancel(); } catch {}
  }, []);

  const onDefaults = useCallback(() => {
    setVisualize(true);
    setPliesLimit(80);
    setSetsCount(10);
    setP1Depth(3); setP2Depth(3);
    setP1Mode('auto'); setP2Mode('auto');
    setP1Secs(3); setP2Secs(3);
  }, []);

  const onExportJSON = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia.json'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const onExportCSV = useCallback(() => {
    try {
      const header = 'id,setId,startedAt,durationMs,moves,winner,p1Depth,p2Depth\n';
      const rows = records.map(r => `${r.id},${r.setId || ''},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const onExportCSVDetails = useCallback(() => {
    try {
      const header = 'id,setId,startedAt,durationMs,moves,winner,p1Depth,p2Depth,moveIndex,moveElapsedMs,moveAt,depthReached,nodes,nps,score,player,depthUsed,applied\n';
      const lines: string[] = [];
      for (const r of records) {
        const base = `${r.id},${r.setId || ''},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`;
        const details = r.details && r.details.length ? r.details : [];
        if (details.length === 0) {
          lines.push(`${base},,,,,,,,,`);
          continue;
        }
        for (const d of details) {
          const line = [
            base,
            d.index ?? '',
            Math.round(d.elapsedMs ?? 0),
            d.at ?? '',
            d.depthReached ?? '',
            d.nodes ?? '',
            d.nps ?? '',
            d.score ?? '',
            d.player ?? '',
            d.depthUsed ?? '',
            d.applied ?? '',
          ].join(',');
          lines.push(line);
        }
      }
      const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia-details.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const onImportFiles = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    void addFilesFromFileList(files);
    try { (e.target as HTMLInputElement).value = ''; } catch {}
  }, [addFilesFromFileList]);

  const onClearAll = useCallback(() => {
    setRecords([]);
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  // Table actions
  const onViewRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try { alert(`Partida ${id}\nWinner: ${rec.winner}\nMovs: ${rec.moves}\nDuración: ${(rec.durationMs/1000).toFixed(2)}s`); } catch {}
  }, [records]);

  const onCopyRecord = useCallback(async (id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try { await navigator.clipboard.writeText(JSON.stringify(rec)); } catch {}
  }, [records]);

  const onDownloadRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try {
      const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `soluna-infoia-${id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const onDeleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <InfoIAView
      running={running}
      onStart={onStart}
      onStop={onStop}
      onDefaults={onDefaults}
      onExportJSON={onExportJSON}
      onExportCSV={onExportCSV}
      onExportCSVDetails={onExportCSVDetails}
      onImportFiles={onImportFiles}
      onClearAll={onClearAll}

      activeTab={activeTableSourceId === 'local' ? activeTab : activeTab}
      onChangeTab={setActiveTab}

      compareHeads={compareSets.map(s => ({ id: s.id, name: s.name, color: s.color }))}
      onAddCompare={() => { /* input se maneja desde header Add CSV/JSON */ }}
      onRemoveCompare={removeSet}
      onClearCompare={clearSets}
      chartDatasets={[
        { id: 'local', name: 'Local', color: '#22c55e', records: records.map(r => ({ durationMs: r.durationMs })) },
        ...compareSets.map(s => ({ id: s.id, name: s.name, color: s.color, records: s.records }))
      ]}

      visualize={visualize}
      onToggleVisualize={() => setVisualize(v => !v)}
      datasetLabel={datasetLabel}

      pliesLimit={pliesLimit}
      setsCount={setsCount}
      onChangePliesLimit={setPliesLimit}
      onChangeSetsCount={setSetsCount}

      p1={{
        title: 'Jugador 1',
        depth: p1Depth,
        onChangeDepth: setP1Depth,
        timeMode: p1Mode,
        onChangeTimeMode: setP1Mode,
        timeSeconds: p1Secs,
        onChangeTimeSeconds: setP1Secs,
      }}
      p2={{
        title: 'Jugador 2',
        depth: p2Depth,
        onChangeDepth: setP2Depth,
        timeMode: p2Mode,
        onChangeTimeMode: setP2Mode,
        timeSeconds: p2Secs,
        onChangeTimeSeconds: setP2Secs,
      }}

      records={records}

      moveIndex={moveIndex}
      moveElapsedMs={moveElapsedMs}
      moveTargetMs={moveTargetMs}

      progDepth={progDepth}
      progNodes={progNodes}
      progNps={progNps}
      progScore={progScore}

      onViewRecord={onViewRecord}
      onCopyRecord={onCopyRecord}
      onDownloadRecord={onDownloadRecord}
      onDeleteRecord={onDeleteRecord}
    />
  );
};

export default InfoIAContainer;
