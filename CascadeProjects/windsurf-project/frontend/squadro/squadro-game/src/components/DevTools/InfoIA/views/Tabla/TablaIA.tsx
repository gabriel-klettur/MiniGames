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

  return (
    <div className="tabla-ia mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] text-neutral-400">
          {loading ? 'Cargando…' : `${records.length} partidas`}
          {expandedCount > 0 && <span className="ml-2 text-neutral-500">({expandedCount} abiertas)</span>}
        </div>
        <div className="inline-flex items-center gap-1">
          <Button
            size="sm"
            variant="neutral"
            onClick={() => setExpanded(Object.fromEntries(records.map(r => [r.id, true])))}
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
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-neutral-800">
        <table className="min-w-full text-[11px]">
          <thead className="bg-neutral-900/70 text-neutral-300">
            <tr>
              <th className="py-2 px-2 text-left font-semibold">Inicio</th>
              <th className="py-2 px-2 text-left font-semibold">Duración (ms)</th>
              <th className="py-2 px-2 text-left font-semibold">Movs</th>
              <th className="py-2 px-2 text-left font-semibold">Winner</th>
              <th className="py-2 px-2 text-left font-semibold">P1</th>
              <th className="py-2 px-2 text-left font-semibold">P2</th>
              <th className="py-2 px-2 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {records.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="hover:bg-neutral-800/40">
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-left hover:text-neutral-100"
                      onClick={() => toggle(r.id)}
                      title={expanded[r.id] ? 'Contraer' : 'Expandir'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" className={`transition-transform ${expanded[r.id] ? 'rotate-90' : ''}`} aria-hidden>
                        <path d="M8 5l8 7-8 7V5z" fill="currentColor" />
                      </svg>
                      {new Date(r.startedAt).toLocaleTimeString()}
                    </button>
                  </td>
                  <td className="py-2 px-2 font-mono">{Math.round(r.durationMs).toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono">{r.moves}</td>
                  <td className="py-2 px-2">{String(r.winner)}</td>
                  <td className="py-2 px-2 font-mono">{r.p1Depth}</td>
                  <td className="py-2 px-2 font-mono">{r.p2Depth}</td>
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
                    <td className="py-2 px-2" colSpan={7}>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-neutral-300 flex flex-wrap gap-3">
                          <span><strong className="text-neutral-200">Resumen:</strong></span>
                          <span><strong>Winner</strong> {String(r.winner)}</span>
                          <span><strong>Movs</strong> {r.moves}</span>
                          <span><strong>Duración</strong> {Math.round(r.durationMs).toLocaleString()} ms</span>
                          <span><strong>P1</strong> d={r.p1Depth}</span>
                          <span><strong>P2</strong> d={r.p2Depth}</span>
                        </div>
                        <div className="overflow-x-auto rounded border border-neutral-800">
                          <table className="min-w-full text-[11px]">
                            <thead className="bg-neutral-900/70 text-neutral-300">
                              <tr>
                                <th className="py-1 px-2 text-left">#</th>
                                <th className="py-1 px-2 text-left">Jugador</th>
                                <th className="py-1 px-2 text-left">t(ms)</th>
                                <th className="py-1 px-2 text-left">depth</th>
                                <th className="py-1 px-2 text-left">depthReached</th>
                                <th className="py-1 px-2 text-left">nodes</th>
                                <th className="py-1 px-2 text-left">NPS</th>
                                <th className="py-1 px-2 text-left">score</th>
                                <th className="py-1 px-2 text-left">applied</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                              {(r.details || []).map(d => (
                                <tr key={d.index}>
                                  <td className="py-1 px-2 font-mono">{d.index}</td>
                                  <td className="py-1 px-2">{d.player}</td>
                                  <td className="py-1 px-2 font-mono">{Math.round(d.elapsedMs || 0).toLocaleString()}</td>
                                  <td className="py-1 px-2 font-mono">{d.depthUsed ?? ''}</td>
                                  <td className="py-1 px-2 font-mono">{d.depthReached ?? ''}</td>
                                  <td className="py-1 px-2 font-mono">{(d.nodes ?? 0).toLocaleString()}</td>
                                  <td className="py-1 px-2 font-mono">{(d.nps ?? 0).toLocaleString()}</td>
                                  <td className="py-1 px-2 font-mono">{d.score ?? ''}</td>
                                  <td className="py-1 px-2">{d.applied ? '✓' : ''}</td>
                                </tr>
                              ))}
                              {(r.details == null || r.details.length === 0) && (
                                <tr>
                                  <td className="py-2 px-2 text-neutral-400" colSpan={9}>Sin detalles registrados para esta partida.</td>
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
            ))}
            {records.length === 0 && (
              <tr>
                <td className="py-6 text-neutral-400 text-center" colSpan={7}>No hay partidas todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaIA;
