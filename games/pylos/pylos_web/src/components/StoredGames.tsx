import React, { useMemo, useState } from 'react';
import type { FinishedGameRecord } from '../hooks/usePersistence';
import MoveLog from './MoveLog';
import HistoryPagination from './HistoryPagination';

export interface StoredGamesProps {
  games: FinishedGameRecord[];
}

/**
 * StoredGames — lista expandible/colapsable de partidas finalizadas.
 * Muestra metadatos básicos y reutiliza MoveLog para ver los movimientos.
 */
const StoredGames: React.FC<StoredGamesProps> = ({ games }) => {
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const ordered = useMemo(() => {
    // Más recientes primero
    return [...games].sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1));
  }, [games]);

  // Paginación de partidas archivadas
  const PAGE_SIZE = 10;
  const [page, setPage] = useState<number>(1);
  const total = ordered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const end = Math.min(total, start + PAGE_SIZE);
  const pageItems = ordered.slice(start, end);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const labelWinner = (w: FinishedGameRecord['winner']) =>
    w === 'L' ? 'Claras (L)' : w === 'D' ? 'Oscuras (D)' : 'Empate';

  return (
    <section aria-label="Partidas archivadas">
      <h4 style={{ margin: '8px 0' }}>Partidas archivadas</h4>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        {pageItems.map((g) => {
          const isOpen = open.has(g.id);
          const endedLocal = new Date(g.endedAt).toLocaleString();
          const vs = g.simulated ? 'Simulada (IA vs IA)'
            : (g.vsAI ? `Vs ${g.vsAI.enemy === 'L' ? 'Claras (L)' : 'Oscuras (D)'}` : 'Humano vs Humano');
          return (
            <li key={g.id} style={{ border: '1px solid #333', borderRadius: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => toggle(g.id)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#1e1e1e',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 12px',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <strong>{labelWinner(g.winner)}</strong>
                    {g.reason ? <span style={{ opacity: 0.8 }}> — {g.reason}</span> : null}
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{endedLocal} · {vs} · {g.totalMoves} movimientos</div>
                  </div>
                  <span aria-hidden="true" style={{ opacity: 0.8 }}>{isOpen ? '▾' : '▸'}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '8px 12px' }}>
                  <MoveLog moves={g.moves} disablePagination />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {total > PAGE_SIZE && (
        <HistoryPagination total={total} pageSize={PAGE_SIZE} page={pageSafe} onChange={setPage} />
      )}
    </section>
  );
};

export default StoredGames;
