import React, { useMemo, useState } from 'react';
import type { FinishedGameRecord } from '../../hooks/useSolunaHistory';
import MoveLog from './MoveLog';
import HistoryPagination from './HistoryPagination';

export interface StoredGamesProps {
  games: FinishedGameRecord[];
}

/**
 * StoredGames — lista plegable de partidas archivadas.
 * Ordena por fecha descendente y reutiliza MoveLog para ver movimientos.
 */
type Player = 1 | 2;

interface GroupedSet {
  id: string;
  items: FinishedGameRecord[];
  score: { 1: number; 2: number };
  winner: Player | null; // quien llegó a 4, si aplica
  endedAt: string; // fin del set (última partida)
}

const StoredGames: React.FC<StoredGamesProps> = ({ games }) => {
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  // Agrupar partidas en "sets" hasta que un jugador alcance 4 estrellas
  const groupedSets = useMemo<GroupedSet[]>(() => {
    if (!games || games.length === 0) return [];
    // Procesamos cronológicamente para acumular estrellas
    const asc = [...games].sort((a, b) => (a.endedAt < b.endedAt ? -1 : 1));
    const out: GroupedSet[] = [];
    let cur: GroupedSet | null = null;
    let score = { 1: 0, 2: 0 } as { 1: number; 2: number };

    for (const g of asc) {
      if (!cur) {
        cur = { id: `set-${g.id}`, items: [], score: { 1: 0, 2: 0 }, winner: null, endedAt: g.endedAt };
        score = { 1: 0, 2: 0 };
      }
      cur.items.push(g);
      cur.endedAt = g.endedAt;

      if (g.winner === 1 || g.winner === 2) {
        score = { ...score, [g.winner]: score[g.winner] + 1 } as { 1: number; 2: number };
        cur.score = score;
      }

      const reached = score[1] >= 4 || score[2] >= 4;
      if (reached) {
        cur.winner = score[1] >= 4 ? 1 : 2;
        cur.id = `set-${cur.items[0].id}-${cur.items[cur.items.length - 1].id}`;
        out.push(cur);
        cur = null;
        score = { 1: 0, 2: 0 };
      }
    }

    // Si hay un set parcial (aún sin llegar a 4), también lo mostramos
    if (cur) {
      cur.id = `set-${cur.items[0].id}-${cur.items[cur.items.length - 1].id}`;
      out.push(cur);
    }

    // Mostramos sets por fecha de fin descendente
    return out.sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1));
  }, [games]);

  // Paginación a nivel de set
  const PAGE_SIZE = 5;
  const [page, setPage] = useState<number>(1);
  const total = groupedSets.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const end = Math.min(total, start + PAGE_SIZE);
  const pageItems = groupedSets.slice(start, end);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const labelWinnerRound = (w: FinishedGameRecord['winner']) =>
    w === 1 ? 'Jugador 1' : w === 2 ? 'Jugador 2' : 'Empate';

  const labelWinnerSet = (g: GroupedSet) =>
    g.winner ? `Ganador del set: Jugador ${g.winner}` : 'Set en curso';

  const scoreText = (s: { 1: number; 2: number }) => `J1 ${s[1]} — ${s[2]} J2`;

  return (
    <section aria-label="Partidas archivadas">
      <h4 style={{ margin: '8px 0' }}>Partidas archivadas</h4>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        {pageItems.map((set) => (
          <li key={set.id} style={{ border: '1px solid #333', borderRadius: 8, marginBottom: 12 }}>
            <div
              style={{
                width: '100%',
                background: '#151515',
                color: '#fff',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                padding: '10px 12px',
                borderBottom: '1px solid #333',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <strong>{labelWinnerSet(set)}</strong>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{scoreText(set.score)}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Finalizó: {new Date(set.endedAt).toLocaleString()}</div>
              </div>
            </div>

            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
              {set.items
                .slice() // mostrar partidas del set por fecha descendente
                .sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1))
                .map((g) => {
                  const isOpen = open.has(g.id);
                  const endedLocal = new Date(g.endedAt).toLocaleString();
                  const vs = g.simulated ? 'Simulada (IA vs IA)' : '';
                  return (
                    <li key={g.id} style={{ borderTop: '1px solid #333' }}>
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
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <strong>{labelWinnerRound(g.winner)}</strong>
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
          </li>
        ))}
      </ul>
      {total > PAGE_SIZE && (
        <HistoryPagination total={total} pageSize={PAGE_SIZE} page={pageSafe} onChange={setPage} />
      )}
    </section>
  );
};

export default StoredGames;

