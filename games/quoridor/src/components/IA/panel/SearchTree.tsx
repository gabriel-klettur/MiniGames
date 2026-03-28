import React from 'react';
import type { TraceEvent } from '../../../ia/types.ts';
import { useTraceBuffer } from '../../../ia/trace.ts';

/**
 * SearchTree
 * Construye un árbol a partir de los eventos de traza (node_enter/node_exit/...)
 * y lo muestra en forma colapsable. Por defecto toma la última iteración (iter_start más reciente).
 */
export default function SearchTree() {
  const { events } = useTraceBuffer();

  const { roots, meta } = React.useMemo(() => buildTree(events), [events]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-300">
        Iteración: <span className="tabular-nums">{meta.iterDepth ?? '-'}</span> · Nodos: <span className="tabular-nums">{meta.nodeCount}</span>
      </div>
      <div className="max-h-[460px] overflow-auto rounded-md border border-white/10 bg-gray-900/60 p-2">
        {roots.length === 0 ? (
          <div className="text-xs text-gray-400">No hay nodos todavía. Activa trazas y ejecuta la IA.</div>
        ) : (
          <ul className="text-xs leading-5">
            {roots.map((n) => (
              <TreeNode key={n.id} node={n} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- Tipos internos para render ----

type TreeNodeData = {
  id: number;
  parentId?: number;
  ply: number;
  depth: number;
  maximizing: boolean;
  alpha?: number;
  beta?: number;
  score?: number;
  bestMove?: any;
  cutoff?: 'alpha' | 'beta';
  children: TreeNodeData[];
};

function buildTree(events: ReadonlyArray<TraceEvent>) {
  // Seleccionar última iteración completa si existe; si no, desde último iter_start hasta fin.
  let lastIterIdx = -1;
  let iterDepth: number | undefined = undefined;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === 'iter_start') { lastIterIdx = i; iterDepth = e.depth; break; }
  }
  let slice: TraceEvent[];
  if (lastIterIdx >= 0) {
    // Buscar el próximo iter_end del mismo depth; si no hay, usamos el final
    let endIdx = -1;
    for (let i = lastIterIdx + 1; i < events.length; i++) {
      const e = events[i];
      if (e.type === 'iter_end' && e.depth === iterDepth) { endIdx = i; break; }
    }
    slice = events.slice(lastIterIdx, endIdx >= 0 ? endIdx + 1 : events.length) as TraceEvent[];
  } else {
    slice = events as TraceEvent[];
  }

  const byId = new Map<number, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  for (const e of slice) {
    if (e.type === 'node_enter') {
      const node: TreeNodeData = {
        id: e.nodeId,
        parentId: e.parentId,
        ply: e.ply,
        depth: e.depth,
        maximizing: e.maximizing,
        alpha: e.alpha,
        beta: e.beta,
        children: [],
      };
      byId.set(node.id, node);
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    } else if (e.type === 'node_exit') {
      const n = byId.get(e.nodeId);
      if (n) {
        n.score = e.score;
        n.bestMove = e.bestMove;
      }
    } else if (e.type === 'cutoff') {
      const n = byId.get(e.nodeId);
      if (n && !n.cutoff) n.cutoff = e.reason;
    }
  }

  return { roots, meta: { nodeCount: byId.size, iterDepth } } as const;
}

function TreeNode({ node }: { node: TreeNodeData }) {
  const [open, setOpen] = React.useState(node.ply <= 2);
  const color = node.maximizing ? 'text-emerald-300' : 'text-rose-300';
  const badge = node.cutoff ? (
    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-200 border border-amber-400/20">✂ {node.cutoff}</span>
  ) : null;

  return (
    <li>
      <div className="flex items-start gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 w-5 h-5 grid place-items-center rounded bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700"
          aria-label={open ? 'Colapsar' : 'Expandir'}
        >{open ? '−' : '+'}</button>
        <div className="flex-1">
          <div className="text-gray-200">
            <span className={color}>ply {node.ply}</span>
            <span className="ml-2 text-gray-400">d={node.depth}</span>
            {typeof node.alpha === 'number' && <span className="ml-2 text-gray-400">α={fmt(node.alpha)}</span>}
            {typeof node.beta === 'number' && <span className="ml-1 text-gray-400">β={fmt(node.beta)}</span>}
            {typeof node.score === 'number' && <span className="ml-2 text-gray-300">score=<span className="tabular-nums">{fmt(node.score)}</span></span>}
            {badge}
          </div>
          {open && node.children.length > 0 && (
            <ul className="ml-6 border-l border-white/10 pl-3 mt-1 space-y-1">
              {node.children.map((ch) => (
                <TreeNode key={ch.id} node={ch} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function fmt(n: number) {
  const v = Number(n);
  return isFinite(v) ? v.toFixed(2) : String(n);
}
