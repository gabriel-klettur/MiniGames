import React, { useCallback, useMemo, useState } from 'react';
import type { InfoIARecord } from '../../types';
import Button from '../../../../ui/Button';

interface TablaIAProps {
  records: InfoIARecord[];
  loading?: boolean;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

const TablaIA: React.FC<TablaIAProps> = ({ records, loading = false, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = useCallback((id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] })), []);
  const expandedCount = useMemo(() => Object.values(expanded).filter(Boolean).length, [expanded]);
  const dupCountByMoves = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of records) m.set(r.moves, (m.get(r.moves) || 0) + 1);
    return m;
  }, [records]);
  // Palette of professional, subtle hues for duplicate groups
  const palette = useMemo(() => ([
    { bgRow: 'bg-amber-900/10', marker: 'bg-amber-400', badgeBorder: 'border-amber-500/30', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-300' },
    { bgRow: 'bg-sky-900/10', marker: 'bg-sky-400', badgeBorder: 'border-sky-500/30', badgeBg: 'bg-sky-500/10', badgeText: 'text-sky-300' },
    { bgRow: 'bg-violet-900/10', marker: 'bg-violet-400', badgeBorder: 'border-violet-500/30', badgeBg: 'bg-violet-500/10', badgeText: 'text-violet-300' },
    { bgRow: 'bg-emerald-900/10', marker: 'bg-emerald-400', badgeBorder: 'border-emerald-500/30', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-300' },
    { bgRow: 'bg-rose-900/10', marker: 'bg-rose-400', badgeBorder: 'border-rose-500/30', badgeBg: 'bg-rose-500/10', badgeText: 'text-rose-300' },
    { bgRow: 'bg-indigo-900/10', marker: 'bg-indigo-400', badgeBorder: 'border-indigo-500/30', badgeBg: 'bg-indigo-500/10', badgeText: 'text-indigo-300' },
    { bgRow: 'bg-lime-900/10', marker: 'bg-lime-400', badgeBorder: 'border-lime-500/30', badgeBg: 'bg-lime-500/10', badgeText: 'text-lime-300' },
    { bgRow: 'bg-fuchsia-900/10', marker: 'bg-fuchsia-400', badgeBorder: 'border-fuchsia-500/30', badgeBg: 'bg-fuchsia-500/10', badgeText: 'text-fuchsia-300' },
    { bgRow: 'bg-cyan-900/10', marker: 'bg-cyan-400', badgeBorder: 'border-cyan-500/30', badgeBg: 'bg-cyan-500/10', badgeText: 'text-cyan-300' },
  ]), []);
  // Stable group index per duplicated moves value (A, B, C...)
  const dupGroupIndexByMoves = useMemo(() => {
    const m = new Map<number, number>();
    const keys = Array.from(dupCountByMoves.entries())
      .filter(([, c]) => c >= 2)
      .map(([k]) => k)
      .sort((a, b) => a - b);
    keys.forEach((k, i) => m.set(k, i));
    return m;
  }, [dupCountByMoves]);
  // Precompute a display legend for duplicate groups
  const dupGroups = useMemo(() => {
    const arr: Array<{ moves: number; count: number; idx: number }> = [];
    dupCountByMoves.forEach((count, mv) => {
      if (count >= 2) arr.push({ moves: mv, count, idx: dupGroupIndexByMoves.get(mv) ?? 0 });
    });
    return arr.sort((a, b) => a.moves - b.moves);
  }, [dupCountByMoves, dupGroupIndexByMoves]);

  const sigData = useMemo(() => {
    const sigById = new Map<string, string>();
    const countBySig = new Map<string, number>();
    const shortBySig = new Map<string, string>();
    // Core signature (only moves count + sequence), for filtering 'Solo idénticas'
    const coreSigById = new Map<string, string>();
    const countByCoreSig = new Map<string, number>();
    for (const r of records) {
      const rows = r.details || [];
      const hasAllZ = rows.length > 0 && rows.every(d => typeof d.zKey === 'number');
      const core = hasAllZ
        ? 'Z:' + rows.map(d => String(((d.zKey as number) >>> 0).toString(36))).join('-')
        : 'M:' + rows.map(d => String(d.bestMove ?? '')).join('|');
      const sig = `W${String(r.winner)}|N${r.moves}|D${r.p1Depth}:${r.p2Depth}|${core}`;
      sigById.set(r.id, sig);
      countBySig.set(sig, (countBySig.get(sig) || 0) + 1);
      const coreSig = `N${r.moves}|${core}`;
      coreSigById.set(r.id, coreSig);
      countByCoreSig.set(coreSig, (countByCoreSig.get(coreSig) || 0) + 1);
      // short hash (FNV-1a 32-bit, base36)
      let h = 2166136261 >>> 0;
      for (let i = 0; i < sig.length; i++) { h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      shortBySig.set(sig, h.toString(36));
    }
    const idxBySig = new Map<string, number>();
    const keys = Array.from(countBySig.entries()).filter(([, c]) => c >= 2).map(([k]) => k).sort();
    keys.forEach((k, i) => idxBySig.set(k, i));
    return { sigById, countBySig, idxBySig, shortBySig, coreSigById, countByCoreSig };
  }, [records]);

  const exactPalette = useMemo(() => ([
    { marker: 'bg-emerald-400', badgeBorder: 'border-emerald-500/30', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-300' },
    { marker: 'bg-blue-400',    badgeBorder: 'border-blue-500/30',    badgeBg: 'bg-blue-500/10',    badgeText: 'text-blue-300' },
    { marker: 'bg-teal-400',    badgeBorder: 'border-teal-500/30',    badgeBg: 'bg-teal-500/10',    badgeText: 'text-teal-300' },
    { marker: 'bg-orange-400',  badgeBorder: 'border-orange-500/30',  badgeBg: 'bg-orange-500/10',  badgeText: 'text-orange-300' },
    { marker: 'bg-pink-400',    badgeBorder: 'border-pink-500/30',    badgeBg: 'bg-pink-500/10',    badgeText: 'text-pink-300' },
    { marker: 'bg-cyan-400',    badgeBorder: 'border-cyan-500/30',    badgeBg: 'bg-cyan-500/10',    badgeText: 'text-cyan-300' },
  ]), []);

  const [showUnique, setShowUnique] = useState<boolean>(false);
  const [showOnlyExact, setShowOnlyExact] = useState<boolean>(false);
  const [selectedMoves, setSelectedMoves] = useState<Set<number>>(new Set());
  const hasFilter = selectedMoves.size > 0;
  const [compareMoves, setCompareMoves] = useState<boolean>(false);
  const [compareUseZKey, setCompareUseZKey] = useState<boolean>(false);

  const handleClickGroup = useCallback((mv: number, ev: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLSpanElement>) => {
    setSelectedMoves(prev => {
      const next = new Set(prev);
      const multi = (ev as any).ctrlKey || (ev as any).metaKey || (ev as any).shiftKey;
      const isSelected = next.has(mv);
      if (multi) {
        if (isSelected) next.delete(mv); else next.add(mv);
        return next;
      }
      // single-select toggle
      if (isSelected && next.size === 1) {
        return new Set(); // clear when clicking the only selected
      }
      return new Set([mv]);
    });
  }, []);

  const clearFilter = useCallback(() => setSelectedMoves(new Set()), []);

  const list = useMemo(() => {
    let base = hasFilter ? records.filter(r => selectedMoves.has(r.moves)) : records;
    if (showOnlyExact) {
      base = base.filter(r => {
        const c = sigData.coreSigById.get(r.id);
        return !!c && (sigData.countByCoreSig.get(c) || 0) >= 2;
      });
    }
    if (!showUnique) return base;
    const seen = new Set<string>();
    const out: InfoIARecord[] = [];
    for (const r of base) {
      const sig = sigData.sigById.get(r.id) || r.id;
      if (!seen.has(sig)) { seen.add(sig); out.push(r); }
    }
    return out;
  }, [records, showUnique, sigData, hasFilter, selectedMoves, showOnlyExact]);

  return (
    <div className="tabla-ia mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] text-neutral-400" title="Resumen — Cantidad de partidas listadas. Entre paréntesis se indican cuántas filas de detalle están expandidas.">
          {loading ? 'Cargando…' : `${list.length} partidas`}
          {expandedCount > 0 && <span className="ml-2 text-neutral-500">({expandedCount} abiertas)</span>}
          {list.length !== records.length && (
            <span className="ml-2 text-neutral-500">· {records.length} totales</span>
          )}
        </div>
        <div className="inline-flex items-center gap-1">
          <Button
            size="sm"
            variant={showOnlyExact ? 'neutral' : 'outline'}
            onClick={() => setShowOnlyExact(v => !v)}
            title={showOnlyExact ? 'Mostrar todas (sin limitar a partidas exactamente idénticas)' : 'Mostrar solo partidas exactamente idénticas (mismo Movs y misma secuencia; usa zKey si está disponible)'}
          >
            {showOnlyExact ? 'Solo idénticas ✓' : 'Solo idénticas'}
          </Button>
          <Button
            size="sm"
            variant="neutral"
            onClick={() => setExpanded(Object.fromEntries(list.map(r => [r.id, true])))}
            title="Expandir todos los detalles"
          >
            Expandir todo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded({})}
            title="Contraer todos los detalles"
          >
            Contraer todo
          </Button>
          <Button
            size="sm"
            variant={showUnique ? 'neutral' : 'outline'}
            onClick={() => setShowUnique(v => !v)}
            title={showUnique ? 'Mostrar todas las partidas (incluyendo duplicadas exactas)' : 'Colapsar duplicadas exactas (mostrar solo una por firma)'}
          >
            {showUnique ? 'Mostrar todas' : 'Colapsar idénticas'}
          </Button>
          {hasFilter && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilter}
              title="Quitar filtro por grupos (Movs)"
            >
              Limpiar filtro
            </Button>
          )}
          <Button
            size="sm"
            variant={compareMoves ? 'neutral' : 'outline'}
            onClick={() => setCompareMoves(v => !v)}
            title={compareMoves ? 'Ocultar comparación de movimientos' : 'Mostrar comparación de movimientos (columnas por partida)'}
          >
            {compareMoves ? 'Ocultar comparación' : 'Comparar moves'}
          </Button>
          {compareMoves && (
            <Button
              size="sm"
              variant={compareUseZKey ? 'neutral' : 'outline'}
              onClick={() => setCompareUseZKey(v => !v)}
              title={compareUseZKey ? 'Comparar por move (ID)' : 'Comparar por zKey (estado)'}
            >
              {compareUseZKey ? 'zKey ✓' : 'zKey'}
            </Button>
          )}
        </div>
      </div>
      {dupGroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px]">
          {dupGroups.map(g => {
            const pal = palette[g.idx % palette.length];
            const gid = String.fromCharCode(65 + (g.idx % 26));
            const active = selectedMoves.has(g.moves);
            return (
              <button
                key={g.moves}
                type="button"
                onClick={(e) => handleClickGroup(g.moves, e)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-colors ${pal.badgeBorder} ${pal.badgeBg} ${pal.badgeText} ${active ? 'ring-1 ring-offset-1 ring-offset-neutral-900 ring-amber-500/40' : 'hover:opacity-90'} cursor-pointer`}
                title={`Grupo ${gid}: Movs=${g.moves}, repeticiones=${g.count} — Click para filtrar ${active ? '(activo)' : ''}`}
              >
                <span className={`inline-block w-2 h-2 rounded ${pal.marker}`} />
                Grupo {gid} · Movs {g.moves} · ×{g.count}
              </button>
            );
          })}
        </div>
      )}
      {compareMoves && (() => {
        const cols = list.map(r => ({
          id: r.id,
          label: `${new Date(r.startedAt).toLocaleTimeString()} · M${r.moves}`,
          entries: (r.details || []).map(d => (
            compareUseZKey ? (typeof d.zKey === 'number' ? ((d.zKey >>> 0).toString(36)) : '') : String(d.bestMove ?? '')
          )),
        }));
        const maxRows = cols.reduce((m, c) => Math.max(m, c.entries.length), 0);
        return (
          <div className="overflow-auto rounded-md border border-neutral-800 mb-2" title="Comparación por movimientos — Cada columna es una partida; cada fila es un índice de jugada.">
            <table className="min-w-full text-[11px]">
              <thead className="bg-neutral-900/70 text-neutral-300">
                <tr>
                  <th className="py-2 px-2 text-left font-semibold w-12" title="# de jugada">#</th>
                  {cols.map(c => (
                    <th key={c.id} className="py-2 px-2 text-left font-semibold whitespace-nowrap" title={c.label}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {Array.from({ length: maxRows }).map((_, i) => {
                  const rowVals = cols.map(c => c.entries[i] ?? '');
                  const allEq = rowVals.length > 0 && rowVals.every(v => v && v === rowVals[0]);
                  return (
                    <tr key={i} className={allEq ? 'bg-emerald-900/10' : ''}>
                      <td className="py-1 px-2 font-mono text-neutral-400">{i + 1}</td>
                      {rowVals.map((v, j) => (
                        <td key={j} className={`py-1 px-2 font-mono ${allEq ? 'text-emerald-300' : ''}`}>{v || '—'}</td>
                      ))}
                    </tr>
                  );
                })}
                {cols.length === 0 && (
                  <tr>
                    <td className="py-2 px-2 text-neutral-400" colSpan={1}>Sin datos para comparar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      <div className="overflow-x-auto rounded-md border border-neutral-800" title="Tabla de partidas — Click en Inicio para expandir/contraer detalles; usa Acciones para copiar/descargar/eliminar.">
        <table className="min-w-full text-[11px]">
          <thead className="bg-neutral-900/70 text-neutral-300">
            <tr>
              <th className="py-2 px-2 text-left font-semibold" title="Inicio — Hora de inicio de la partida. Ejemplo: 12:34:56 PM.">Inicio</th>
              <th className="py-2 px-2 text-left font-semibold" title="Duración — Tiempo total de la partida en milisegundos. Ejemplo: 12 345 ms.">Duración (ms)</th>
              <th className="py-2 px-2 text-left font-semibold" title="Movs — Número de jugadas totales realizadas. Ejemplo: 37.">Movs</th>
              <th className="py-2 px-2 text-left font-semibold" title="Winner — Ganador de la partida (Light/Dark) o 0 para empate.">Winner</th>
              <th className="py-2 px-2 text-left font-semibold" title="P1 — Profundidad (objetivo o alcanzada) asociada al jugador 1. Útil para comparar configuraciones.">P1</th>
              <th className="py-2 px-2 text-left font-semibold" title="P2 — Profundidad (objetivo o alcanzada) asociada al jugador 2. Útil para comparar configuraciones.">P2</th>
              <th className="py-2 px-2 text-left font-semibold" title="Tune — Resumen del ajuste de heurísticas en esta partida (pasos, error, cambio de pesos, bandos afinados).">Tune</th>
              <th className="py-2 px-2 text-left font-semibold" title="Acciones — Ver detalles, copiar JSON, descargar o eliminar el registro.">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {list.map((r) => {
              const count = dupCountByMoves.get(r.moves) || 0;
              const gIdx = dupGroupIndexByMoves.get(r.moves);
              const pal = (gIdx !== undefined) ? palette[(gIdx as number) % palette.length] : null;
              const groupId = (gIdx !== undefined) ? String.fromCharCode(65 + ((gIdx as number) % 26)) : null;
              const sig = sigData.sigById.get(r.id) || '';
              const exact = sig ? (sigData.countBySig.get(sig) || 0) : 0;
              const eIdx = sig && exact >= 2 ? (sigData.idxBySig.get(sig) ?? 0) : undefined;
              const ePal = (eIdx !== undefined) ? exactPalette[(eIdx as number) % exactPalette.length] : null;
              return (
              <React.Fragment key={r.id}>
                <tr className={`hover:bg-neutral-800/40 ${count >= 2 && pal ? pal.bgRow : ''}` }>
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-left hover:text-neutral-100"
                      onClick={() => toggle(r.id)}
                      title={expanded[r.id] ? 'Contraer' : 'Expandir'}
                    >
                      {(count >= 2 && pal) && (
                        <span className={`inline-block w-1 h-4 rounded ${pal.marker}`} aria-hidden />
                      )}
                      {(ePal && exact >= 2) && (
                        <span className={`inline-block w-1 h-4 rounded ${ePal.marker}`} aria-hidden />
                      )}
                      <svg width="12" height="12" viewBox="0 0 24 24" className={`transition-transform ${expanded[r.id] ? 'rotate-90' : ''}`} aria-hidden>
                        <path d="M8 5l8 7-8 7V5z" fill="currentColor" />
                      </svg>
                      {new Date(r.startedAt).toLocaleTimeString()}
                    </button>
                  </td>
                  <td className="py-2 px-2 font-mono">{Math.round(r.durationMs).toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono">
                    {r.moves}
                    {count >= 2 && pal ? (
                      <span className={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${pal.badgeBorder} ${pal.badgeBg} ${pal.badgeText}`} title={`Grupo ${groupId}: este valor de Movs aparece ${count} veces`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${pal.marker}`} />
                        {groupId} ×{count}
                      </span>
                    ) : null}
                    {exact >= 2 && ePal ? (
                      <span className={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${ePal.badgeBorder} ${ePal.badgeBg} ${ePal.badgeText}`} title={`Partidas idénticas por secuencia de movimientos: ×${exact} · hash=${sigData.shortBySig.get(sig)}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${ePal.marker}`} />
                        Idénticas ×{exact}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 px-2">
                    {(() => {
                      const base = String(r.winner);
                      const x = typeof r.p1Score === 'number' ? r.p1Score : undefined;
                      const y = typeof r.p2Score === 'number' ? r.p2Score : undefined;
                      if (x == null || y == null) return base;
                      const w = r.winner;
                      const p1Cls = w === 'Light' ? 'text-emerald-400' : (w === 'Dark' ? 'text-rose-400' : 'text-neutral-300');
                      const p2Cls = w === 'Dark' ? 'text-emerald-400' : (w === 'Light' ? 'text-rose-400' : 'text-neutral-300');
                      return (
                        <span className="inline-flex items-center gap-1">
                          <span>{base}</span>
                          <span className="font-mono">
                            (
                            <span className={p1Cls} title="Score Jugador 1 (Light)">{x}</span>
                            -
                            <span className={p2Cls} title="Score Jugador 2 (Dark)">{y}</span>
                            )
                          </span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-2 px-2 font-mono">{r.p1Depth}</td>
                  <td className="py-2 px-2 font-mono">{r.p2Depth}</td>
                  <td className="py-2 px-2">
                    {r.tune ? (
                      <div className="inline-flex flex-wrap items-center gap-1" title={`AutoTune — steps=${r.tune.steps}, mae=${r.tune.mae.toFixed(3)}, dW(Light)=${r.tune.dWLight.toFixed(3)}, dW(Dark)=${r.tune.dWDark.toFixed(3)}, lr=${r.tune.lr}, reg=${r.tune.reg}, K=${r.tune.K}, warmup=${r.tune.warmup}`}>
                        <span className="px-1.5 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-300" title="Pasos de SGD usados (tras warmup y máscara)">S {r.tune.steps}</span>
                        <span className="px-1.5 py-0.5 rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-300" title="MAE≈sqrt(SSE/steps)">MAE {r.tune.mae.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-300" title="Σ|Δw| Light">ΔL {r.tune.dWLight.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-300" title="Σ|Δw| Dark">ΔD {r.tune.dWDark.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 rounded-md border border-neutral-600 bg-neutral-700/30 text-neutral-300" title="Bandos afinados (Light/Dark)">{r.tune.tunedLight ? 'L✓' : 'L–'} {r.tune.tunedDark ? 'D✓' : 'D–'}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="neutral" onClick={() => toggle(r.id)} title="Ver/ocultar detalles de la partida">
                        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
                          <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor"/>
                        </svg>
                        Detalles
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onCopyRecord(r.id)} title="Copiar JSON al portapapeles">
                        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
                          <path d="M9 9h10v10H9z" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M5 5h10v10" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        Copiar
                      </Button>
                      <Button size="sm" variant="neutral" onClick={() => onDownloadRecord(r.id)} title="Descargar JSON">
                        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        Descargar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onDeleteRecord(r.id)} title="Eliminar registro">
                        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
                          <path d="M6 7h12M9 7v10m6-10v10M10 4h4l1 2H9l1-2Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
                {expanded[r.id] && (
                  <tr className="bg-neutral-900/40">
                    <td className="py-2 px-2" colSpan={8}>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-neutral-300 flex flex-wrap gap-3">
                          <span><strong className="text-neutral-200">Resumen:</strong></span>
                          <span><strong>Winner</strong> {String(r.winner)}</span>
                          <span><strong>Movs</strong> {r.moves}</span>
                          <span><strong>Duración</strong> {Math.round(r.durationMs).toLocaleString()} ms</span>
                          <span><strong>P1</strong> d={r.p1Depth}</span>
                          <span><strong>P2</strong> d={r.p2Depth}</span>
                        </div>
                        <div className="overflow-x-auto rounded border border-neutral-800" title="Detalles por jugada — Métricas de cada movimiento evaluado: tiempos, profundidad alcanzada, nodos, NPS, score y resumen de heurísticas (opcional).">
                          <table className="min-w-full text-[11px]">
                            <thead className="bg-neutral-900/70 text-neutral-300">
                              <tr>
                                <th className="py-1 px-2 text-left" title="Índice — Número de la jugada dentro de la partida.">#</th>
                                <th className="py-1 px-2 text-left" title="Jugador — Quién mueve en esta jugada (Light/Dark).">Jugador</th>
                                <th className="py-1 px-2 text-left" title="t(ms) — Tiempo empleado por la IA en milisegundos para esta jugada.">t(ms)</th>
                                <th className="py-1 px-2 text-left" title="depthReached — Profundidad máxima realmente alcanzada (puede ser < depth si el tiempo expiró).">depthReached</th>
                                <th className="py-1 px-2 text-left" title="nodes — Número de posiciones evaluadas en esta jugada; total — suma de nodos de toda la partida. Se muestra mov/total para comparar.">nodes</th>
                                <th className="py-1 px-2 text-left" title="NPS — Nodos por segundo (nodes / (t/1000)). Ejemplo: 65 000 indica buen rendimiento.">NPS</th>
                                <th className="py-1 px-2 text-left" title="score — Evaluación heurística; positivo favorece al jugador que mueve.">score</th>
                                <th className="py-1 px-2 text-left" title="Heurísticas aplicadas — Resumen de técnicas activas durante la búsqueda de esta jugada (TT, PVS, LMR, Aspiration,…).">Heur</th>
                                <th className="py-1 px-2 text-left" title="move — Identificador del movimiento aplicado (ID de pieza).">move</th>
                                <th className="py-1 px-2 text-left" title="applied — Indica si la mejor jugada encontrada fue aplicada al tablero (✓).">applied</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                              {(() => {
                                const rows = r.details || [];
                                const totalNodes = rows.reduce((acc, dd) => acc + (dd.nodes || 0), 0);
                                return rows.map(d => (
                                  <tr key={d.index}>
                                    <td className="py-1 px-2 font-mono">{d.index}</td>
                                    <td className="py-1 px-2">{d.player}</td>
                                    <td className="py-1 px-2 font-mono">{Math.round(d.elapsedMs || 0).toLocaleString()}</td>
                                    <td className="py-1 px-2 font-mono">{d.depthReached ?? ''}</td>
                                    <td className="py-1 px-2 font-mono" title={`nodes de la jugada / nodos totales de la partida`}>
                                      {(d.nodes ?? 0).toLocaleString()} <span className="text-neutral-500">/ {totalNodes.toLocaleString()}</span>
                                    </td>
                                    <td className="py-1 px-2 font-mono">{(d.nps ?? 0).toLocaleString()}</td>
                                    <td className="py-1 px-2 font-mono">{d.score ?? ''}</td>
                                    <td className="py-1 px-2">
                                        {(() => {
                                          const ex = d.explain || {};
                                          const items: Array<{ key: string; label: string; title: string } > = [];
                                          if (typeof ex.ttProbes === 'number' && ex.ttProbes > 0) {
                                            const hits = typeof ex.ttHits === 'number' ? ex.ttHits : 0;
                                            const rate = ex.ttProbes > 0 ? Math.round((hits / ex.ttProbes) * 100) : 0;
                                            items.push({ key: 'TT', label: `TT ${rate}%` , title: `Transposition Table — probes/hits: ${ex.ttProbes}/${hits}` });
                                          }
                                          if (typeof ex.pvsReSearches === 'number' && ex.pvsReSearches > 0) {
                                            items.push({ key: 'PVS', label: `PVS ${ex.pvsReSearches}`, title: 'PVS re-searches' });
                                          }
                                          if (typeof ex.lmrReductions === 'number' && ex.lmrReductions > 0) {
                                            items.push({ key: 'LMR', label: `LMR ×${ex.lmrReductions}`, title: 'Late Move Reductions applied' });
                                          }
                                          if (typeof ex.aspReSearches === 'number' && ex.aspReSearches > 0) {
                                            items.push({ key: 'ASP', label: `ASP ${ex.aspReSearches}`, title: 'Aspiration-window re-searches' });
                                          }
                                          if (typeof (ex as any).cutoffs === 'number' && (ex as any).cutoffs > 0) {
                                            items.push({ key: 'CUT', label: `CUT ${String((ex as any).cutoffs)}`, title: 'Beta cutoffs (α ≥ β) registrados en el subárbol' });
                                          }
                                          if (ex.hashMoveUsed) {
                                            items.push({ key: 'HASH', label: 'HASH', title: 'Se usó hash/PV/IID move para priorizar el orden en raíz' });
                                          }
                                          if (typeof (ex as any).killersTried === 'number' && (ex as any).killersTried > 0) {
                                            items.push({ key: 'KLR', label: `KLR ${String((ex as any).killersTried)}`, title: 'Killer moves intentadas en este subárbol' });
                                          }
                                          if (typeof (ex as any).historyUpdates === 'number' && (ex as any).historyUpdates > 0) {
                                            items.push({ key: 'HIST', label: `HIST ${String((ex as any).historyUpdates)}`, title: 'Actualizaciones de la tabla de historia (history heuristic)' });
                                          }
                                          if (typeof (ex as any).qPlies === 'number' && (ex as any).qPlies > 0) {
                                            items.push({ key: 'Qp', label: `Qp ${String((ex as any).qPlies)}`, title: 'Plies de quiescence alcanzados (máximo en la jugada)' });
                                          }
                                          if (typeof (ex as any).qNodes === 'number' && (ex as any).qNodes > 0) {
                                            items.push({ key: 'Qn', label: `Qn ${String((ex as any).qNodes)}`, title: 'Nodos evaluados en quiescence' });
                                          }
                                          if (typeof (ex as any).lmpPrunes === 'number' && (ex as any).lmpPrunes > 0) {
                                            items.push({ key: 'LMP', label: `LMP ${String((ex as any).lmpPrunes)}`, title: 'Late Move Pruning — jugadas podadas por tardías' });
                                          }
                                          if (typeof (ex as any).futilityPrunes === 'number' && (ex as any).futilityPrunes > 0) {
                                            items.push({ key: 'FUT', label: `FUT ${String((ex as any).futilityPrunes)}`, title: 'Futility pruning — podas por margen insuficiente' });
                                          }
                                          if (typeof (ex as any).iidProbes === 'number' && (ex as any).iidProbes > 0) {
                                            items.push({ key: 'IID', label: `IID ${String((ex as any).iidProbes)}`, title: 'Internal Iterative Deepening — sondas depth-1 para ordenar' });
                                          }
                                          if (typeof (ex as any).tbHits === 'number' && (ex as any).tbHits > 0) {
                                            items.push({ key: 'TB', label: `TB ${String((ex as any).tbHits)}`, title: 'Tablebase hits (atajos por finales resueltos)' });
                                          }
                                          if (items.length === 0) return <span className="text-neutral-500">—</span>;
                                          return (
                                            <div className="flex flex-wrap gap-1">
                                              {items.slice(0, 6).map(it => (
                                                <span key={it.key} className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-300" title={it.title}>
                                                  {it.label}
                                                </span>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </td>
                                    <td className="py-1 px-2 font-mono" title="Movimiento aplicado">{String(d.bestMove ?? '')}</td>
                                    <td className="py-1 px-2">{d.applied ? '✓' : ''}</td>
                                  </tr>
                                ));
                              })()}
                              {(r.details == null || r.details.length === 0) && (
                                <tr>
                                  <td className="py-2 px-2 text-neutral-400" colSpan={10}>Sin detalles registrados para esta partida.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );})}
            {records.length === 0 && (
              <tr>
                <td className="py-6 text-neutral-400 text-center" colSpan={8}>No hay partidas todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaIA;
