import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import { setTraceEnabled, setTraceSampleRate, setTraceMaxDepth, setTraceCap } from '../../../store/iaSlice.ts';
import { useTraceBuffer } from '../../../ia/trace.ts';
import SearchTree from './SearchTree.tsx';

export default function TracePanel() {
  const dispatch = useAppDispatch();
  const trace = useAppSelector((s: RootState) => s.ia.trace);
  const { events, stats, clear, setCap } = useTraceBuffer();
  const [view, setView] = React.useState<'tree' | 'timeline'>(() => 'tree');

  React.useEffect(() => {
    if (trace.cap !== stats.cap) setCap(trace.cap);
  }, [trace.cap, stats.cap, setCap]);

  const eventCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) map.set(e.type, (map.get(e.type) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const lastEvents = React.useMemo(() => {
    const MAX_SHOW = 200;
    const start = Math.max(0, events.length - MAX_SHOW);
    return events.slice(start).reverse();
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={trace.enabled}
            onChange={(e) => dispatch(setTraceEnabled(e.target.checked))}
          />
          Trazas activas
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <span>Sample</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={trace.sampleRate}
            onChange={(e) => dispatch(setTraceSampleRate(Number(e.target.value)))}
          />
          <span className="tabular-nums w-10 text-right">{trace.sampleRate.toFixed(2)}</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <span>Max depth</span>
          <input
            type="number"
            className="w-20 bg-gray-800 text-gray-100 rounded px-2 py-1 border border-white/10"
            value={trace.maxDepth ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : Number(e.target.value);
              dispatch(setTraceMaxDepth(isNaN(v as number) ? undefined : (v as number)));
            }}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <span>Cap</span>
          <input
            type="number"
            className="w-24 bg-gray-800 text-gray-100 rounded px-2 py-1 border border-white/10"
            value={trace.cap}
            onChange={(e) => dispatch(setTraceCap(Number(e.target.value)))}
          />
        </label>
        <button
          className="ml-auto text-sm rounded-md bg-gray-800 border border-white/10 px-3 py-1 hover:bg-gray-700"
          onClick={() => clear()}
        >
          Limpiar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Vista:</span>
        <div className="inline-flex overflow-hidden rounded-md border border-white/10">
          <button
            className={[
              'px-3 py-1.5 text-sm',
              view === 'tree' ? 'bg-gray-800 text-white' : 'bg-gray-900/40 text-gray-300 hover:text-white'
            ].join(' ')}
            onClick={() => setView('tree')}
          >Árbol</button>
          <button
            className={[
              'px-3 py-1.5 text-sm',
              view === 'timeline' ? 'bg-gray-800 text-white' : 'bg-gray-900/40 text-gray-300 hover:text-white'
            ].join(' ')}
            onClick={() => setView('timeline')}
          >Timeline</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-gray-900/60 p-3">
          <div className="text-sm text-gray-300">Buffer</div>
          <div className="mt-1 text-xs text-gray-400">
            <div>Eventos: <span className="tabular-nums">{stats.size}</span> / {stats.cap}</div>
            <div>Totales recibidos: <span className="tabular-nums">{stats.total}</span></div>
            <div>Descartados: <span className="tabular-nums">{stats.dropped}</span></div>
          </div>
          <div className="mt-3 text-sm text-gray-300">Tipos</div>
          <ul className="mt-1 max-h-40 overflow-auto text-xs text-gray-400 space-y-1">
            {eventCounts.map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="tabular-nums">{v}</span></li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 rounded-lg border border-white/10 bg-gray-900/60 p-3">
          {view === 'tree' ? (
            <SearchTree />
          ) : (
            <>
              <div className="text-sm text-gray-300 mb-2">Timeline (últimos {lastEvents.length})</div>
              <ul className="max-h-64 overflow-auto space-y-1 text-xs">
                {lastEvents.map((e, idx) => (
                  <li key={idx} className="px-2 py-1 rounded bg-gray-800/60 border border-white/5">
                    <EventRow ev={e} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ ev }: { ev: any }) {
  if (ev.type === 'node_enter') {
    return (
      <span className="text-gray-200">↘ node_enter</span>
    );
  }
  if (ev.type === 'node_exit') {
    return (
      <span className="text-gray-200">↗ node_exit score=<span className="tabular-nums">{ev.score.toFixed?.(2) ?? ev.score}</span></span>
    );
  }
  if (ev.type === 'eval') {
    return (
      <span className="text-gray-200">∑ eval score=<span className="tabular-nums">{ev.score.toFixed?.(2) ?? ev.score}</span></span>
    );
  }
  if (ev.type === 'cutoff') {
    return (
      <span className="text-gray-200">✂ cutoff [{ev.reason}] α={fmt(ev.alpha)} β={fmt(ev.beta)}</span>
    );
  }
  if (ev.type === 'tt_hit') {
    return (
      <span className="text-gray-200">⚡ tt_hit</span>
    );
  }
  if (ev.type === 'best_update') {
    return (
      <span className="text-gray-200">★ best_update score=<span className="tabular-nums">{fmt(ev.score)}</span></span>
    );
  }
  if (ev.type === 'iter_start') return <span className="text-gray-200">▶ iter_start d={ev.depth}</span>;
  if (ev.type === 'iter_end') return <span className="text-gray-200">■ iter_end d={ev.depth}</span>;
  return <span className="text-gray-200">{ev.type}</span>;
}

function fmt(n: any) {
  const v = Number(n);
  return isFinite(v) ? v.toFixed(2) : String(n);
}
