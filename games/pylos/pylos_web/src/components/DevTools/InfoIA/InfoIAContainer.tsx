import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { GameState } from '../../../game/types';
import type { InfoIAGameRecord } from '../../../utils/infoiaDb';
import InfoIAView from './InfoIAView';
import { getAllRecords, saveRecord, deleteRecord, clearAllRecords } from './services/storage';
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { useExports } from './hooks/useExports';
import { publishAllBooksToDevServer, clearBooksOnDevServer } from './services/publishBooks';
import { useInfoIASim } from './hooks/useInfoIASim';
import type { TimeMode } from './types';
import { LS_KEYS, type FinishedGameRecord } from '../../../hooks/usePersistence';
import { decodeSignature } from '../../../ia/signature';
import { posKey } from '../../../game/board';

export type InfoIAProps = {
  onMirrorStart?: () => void;
  onMirrorUpdate?: (s: GameState) => void;
  onMirrorEnd?: (s: GameState) => void;
  gameState: GameState;
  noShade: { 0: boolean; 1: boolean; 2: boolean; 3: boolean };
  shadeOnlyHoles: boolean;
  showHoleBorders: boolean;
};

export default function InfoIAContainer(props: InfoIAProps) {
  // Records DB
  const [records, setRecords] = useState<InfoIAGameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Toast state
  const [toast, setToast] = useState<null | { message: string; kind: 'success' | 'error' | 'info' }>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (message: string, kind: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current != null) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, kind });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5400);
  };

  // Compare datasets (shared across tabs)
  const { compareSets, activeTableSourceId, setActiveTableSourceId, addFilesFromFileList, removeSet, clearSets } = useCompareDatasets();

  // Controls
  const [depth, setDepth] = useState<number>(3);
  const [timeMode, setTimeMode] = useState<TimeMode>('auto');
  const [timeSeconds, setTimeSeconds] = useState<number>(8);
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [gamesCount, setGamesCount] = useState<number>(10);
  const [mirrorBoard, setMirrorBoard] = useState<boolean>(true);
  const [useBook, setUseBook] = useState<boolean>(false);
  const [groupByDepth, setGroupByDepth] = useState<boolean>(true);

  // Persist controls locally so defaults apply only when no saved prefs exist
  const STORAGE_KEY = 'pylos.infoia.controls.v1';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return; // keep defaults
      const p = JSON.parse(raw);
      if (Number.isFinite(p?.depth)) setDepth(Math.max(1, Math.min(10, Math.floor(p.depth))));
      if (p?.timeMode === 'auto' || p?.timeMode === 'manual') setTimeMode(p.timeMode);
      if (Number.isFinite(p?.timeSeconds)) setTimeSeconds(Math.max(0, Math.min(30, Number(p.timeSeconds))));
      if (Number.isFinite(p?.pliesLimit)) setPliesLimit(Math.max(1, Math.min(400, Math.floor(p.pliesLimit))));
      if (Number.isFinite(p?.gamesCount)) setGamesCount(Math.max(1, Math.min(1000, Math.floor(p.gamesCount))));
      if (typeof p?.mirrorBoard === 'boolean') setMirrorBoard(p.mirrorBoard);
      // Por petición: 'useBook' permanece en false por defecto y no se restaura
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const payload = { depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, useBook };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, useBook]);

  // Tabs UI: 'repeats' | 'sim' | 'charts' | 'books'
  const [activeTab, setActiveTab] = useState<'repeats' | 'sim' | 'charts' | 'books'>('sim');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllRecords();
      setRecords(all);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  // Simulation
  const { running, start, stop, moveIndex, moveElapsedMs, moveTargetMs, currentSimState } = useInfoIASim({
    depth,
    timeMode,
    timeSeconds,
    pliesLimit,
    gamesCount,
    mirrorBoard,
    useBook,
    onMirrorStart: props.onMirrorStart,
    onMirrorUpdate: props.onMirrorUpdate,
    onMirrorEnd: props.onMirrorEnd,
  });

  const appendSimToFinished = useCallback((rec: InfoIAGameRecord) => {
    try {
      const raw = localStorage.getItem(LS_KEYS.finished);
      const list: FinishedGameRecord[] = raw ? (JSON.parse(raw) as FinishedGameRecord[]) : [];
      // Avoid duplicates by id
      if (list.some((g) => g.id === rec.id)) return;
      const endedAt = new Date(rec.createdAt).toISOString();
      const moves: FinishedGameRecord['moves'] = [];
      for (let i = 0; i < (rec.perMove || []).length; i++) {
        const pm = rec.perMove![i]!;
        const player: 'L' | 'D' = pm.player ?? (i % 2 === 0 ? 'L' : 'D');
        // For simulated games, mimic Player vs IA labeling: L -> Jugador, D -> IA
        const source: 'PLAYER' | 'IA' = player === 'L' ? 'PLAYER' : 'IA';
        if (typeof pm.moveSig === 'number') {
          try {
            const mv = decodeSignature(pm.moveSig as number);
            if (mv.kind === 'place') {
              moves.push({ player, source, text: `colocar ${posKey(mv.dest)}` });
            } else {
              moves.push({ player, source, text: `subir ${posKey(mv.src)} -> ${posKey(mv.dest)}` });
            }
            // Expand recoveries (if any) to match Player vs IA logs
            if (Array.isArray(mv.recovers) && mv.recovers.length > 0) {
              for (const r of mv.recovers) {
                moves.push({ player, source, text: `recuperar ${posKey(r)}` });
              }
              // Close recovery phase
              moves.push({ player, source, text: 'fin recuperación' });
            }
          } catch {
            // Fallback on decode error
            moves.push({ player, source, text: 'movimiento' });
          }
        } else {
          // Fallback when no signature available
          moves.push({ player, source, text: 'movimiento' });
        }
      }
      const mapped: FinishedGameRecord = {
        id: rec.id,
        endedAt,
        winner: rec.winner,
        reason: rec.endedReason,
        vsAI: null, // simulación IA vs IA
        iaDepth: rec.depth,
        iaTimeMode: rec.timeMode,
        iaTimeSeconds: typeof rec.timeSeconds === 'number' ? rec.timeSeconds : 0,
        totalMoves: moves.length,
        moves,
        simulated: true,
      };
      const next = [...list, mapped];
      localStorage.setItem(LS_KEYS.finished, JSON.stringify(next));
      // Notify same-tab listeners to refresh finished games state
      try { window.dispatchEvent(new Event('pylos.finished.changed')); } catch {}
    } catch {
      // ignore persistence errors
    }
  }, []);

  const onStart = useCallback(async () => {
    await start({
      onGame: async (rec: InfoIAGameRecord) => {
        await saveRecord(rec);
        setRecords((prev) => [rec, ...prev]);
        appendSimToFinished(rec);
      },
    });
  }, [start, appendSimToFinished]);

  const onStop = useCallback(() => {
    stop();
  }, [stop]);

  // Export helpers
  const { onExportJSON, onExportBook, onExportCSV } = useExports({ records, compareSets, activeTableSourceId });

  const onDelete = useCallback(async (id: string) => {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onClearAll = useCallback(async () => {
    await clearAllRecords();
    setRecords([]);
  }, []);

  // Books (dev-only)
  const onPublishBooks = useCallback(async (minSupportPct: number) => {
    if (!import.meta.env.DEV) return;
    const activeDs = activeTableSourceId === 'local' ? null : (compareSets.find((s) => s.id === activeTableSourceId) || null);
    const current = activeDs ? activeDs.records : records;
    if (!current || current.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] No hay datos para publicar books.');
      showToast('No hay datos para publicar', 'info');
      return;
    }
    try {
      const res = await publishAllBooksToDevServer({ records: current, minSupportPct });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('[InfoIA] Publicación de libros falló:', res.error);
        showToast('Error al publicar books', 'error');
      } else {
        // eslint-disable-next-line no-console
        console.log('[InfoIA] Libros publicados en /public/books (dev):', res.wrote);
        const srcLabel = activeTableSourceId === 'local'
          ? 'Local'
          : (compareSets.find((s) => s.id === activeTableSourceId)?.name || activeTableSourceId);
        const filesInfo = Array.isArray(res.filesInfo) ? res.filesInfo : [];
        const totalFiles = filesInfo.length;
        const totalEntries = filesInfo.reduce((acc, f) => acc + (f.entries || 0), 0);
        const totalBytes = filesInfo.reduce((acc, f) => acc + (f.bytes || 0), 0);
        const lines: string[] = [];
        lines.push(`Books publicados (soporte ${minSupportPct}%)  Dataset: ${srcLabel}`);
        lines.push(`Archivos: ${totalFiles}, Entradas totales: ${totalEntries}, Bytes: ${totalBytes}`);
        const top = filesInfo
          .slice()
          .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
          .slice(0, 10);
        for (const f of top) {
          lines.push(`- ${f.relativePath}: ${f.entries} entradas, ${f.bytes} bytes`);
        }
        if (filesInfo.length > top.length) {
          lines.push(` y ${filesInfo.length - top.length} más`);
        }
        showToast(lines.join('\n'), 'success');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] Error publicando libros:', err);
      showToast('Error al publicar books', 'error');
    }
  }, [records, compareSets, activeTableSourceId]);

  const onClearBooks = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    try {
      const res = await clearBooksOnDevServer();
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('[InfoIA] Vaciar books falló:', res.error);
        showToast('Error al vaciar books', 'error');
      } else {
        // eslint-disable-next-line no-console
        console.log('[InfoIA] Carpeta public/books vaciada.');
        showToast('Books vaciados', 'success');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] Error al vaciar books:', err);
      showToast('Error al vaciar books', 'error');
    }
  }, []);

  // Compare input handler
  const onCompareFiles = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await addFilesFromFileList(files);
  }, [addFilesFromFileList]);

  const onRemoveCompare = useCallback((id: string) => { removeSet(id); }, [removeSet]);
  const onClearCompare = useCallback(() => { clearSets(); }, [clearSets]);

  // Derived props for child view
  const compareHeads = compareSets.map(s => ({ id: s.id, name: s.name, color: s.color }));
  const compareDatasets = compareSets.map(s => ({ id: s.id, name: s.name, color: s.color, records: s.records }));

  return (
    <InfoIAView
      toast={toast}
      onToast={showToast}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      depth={depth}
      timeMode={timeMode}
      timeSeconds={timeSeconds}
      pliesLimit={pliesLimit}
      gamesCount={gamesCount}
      mirrorBoard={mirrorBoard}
      useBook={useBook}
      running={running}
      loading={loading}
      onChangeDepth={setDepth}
      onChangeTimeMode={setTimeMode}
      onChangeTimeSeconds={setTimeSeconds}
      onChangePliesLimit={setPliesLimit}
      onChangeGamesCount={setGamesCount}
      onChangeMirror={setMirrorBoard}
      onChangeUseBook={setUseBook}
      onStart={onStart}
      onStop={onStop}
      onExportJSON={onExportJSON}
      onExportCSV={onExportCSV}
      onClearAll={onClearAll}
      onResetDefaults={() => {
        setDepth(3);
        setTimeMode('auto');
        setTimeSeconds(8);
        setPliesLimit(80);
        setGamesCount(10);
        setMirrorBoard(true);
        setUseBook(false);
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      }}
      records={records}
      groupByDepth={groupByDepth}
      onToggleGroupByDepth={() => setGroupByDepth((v) => !v)}
      onDelete={onDelete}
      activeTableSourceId={activeTableSourceId}
      compareHeads={compareHeads}
      onSelectTableSource={setActiveTableSourceId}
      canClearLocal={activeTableSourceId === 'local' && records.length > 0}
      compareDatasets={compareDatasets}
      onCompareFiles={onCompareFiles}
      onRemoveCompare={onRemoveCompare}
      onClearCompare={onClearCompare}
      onExportBook={onExportBook}
      onPublishBooks={onPublishBooks}
      onClearBooks={onClearBooks}
      moveIndex={moveIndex}
      moveElapsedMs={moveElapsedMs}
      moveTargetMs={moveTargetMs}
      currentSimState={currentSimState}
      gameState={props.gameState}
      noShade={props.noShade}
      shadeOnlyHoles={props.shadeOnlyHoles}
      showHoleBorders={props.showHoleBorders}
    />
  );
}
