import { useMemo, useState } from 'react';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';
import type { MoveEntry } from '../hooks/usePersistence';
import HistoryPagination from './HistoryPagination';
import { useI18n } from '../i18n';

export interface MoveLogProps {
  moves: MoveEntry[];
  onDownload?: () => void;
  hasArchive?: boolean;
  onClear?: () => void;
  disablePagination?: boolean;
}

/**
 * MoveLog: pretty move list with player icon and source tag (Player/IA/AUTO).
 * Also compacts consecutive duplicate entries with a small counter.
 */
export default function MoveLog({ moves, onDownload, hasArchive = false, onClear, disablePagination = true }: MoveLogProps) {
  const { t } = useI18n();
  type Entry = MoveEntry & { count: number };

  const grouped: Entry[] = useMemo(() => {
    const acc: Entry[] = [];
    for (let i = 0; i < moves.length; i++) {
      const parsed = moves[i];
      const key = `${parsed.source}|${parsed.player}|${parsed.text}`;
      const prev = acc[acc.length - 1];
      if (prev && `${prev.source}|${prev.player}|${prev.text}` === key) {
        prev.count += 1;
      } else {
        acc.push({ ...parsed, count: 1 });
      }
    }
    return acc;
  }, [moves]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState<number>(1);
  const total = grouped.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const end = disablePagination ? total : Math.min(total, start + PAGE_SIZE);
  const pageItems = disablePagination ? grouped : grouped.slice(start, end);

  const iconFor = (p: 'L' | 'D') => (p === 'L' ? bolaB : bolaA);
  const labelFor = (s: MoveEntry['source']) => (s === 'IA' ? 'IA' : s === 'AUTO' ? 'AUTO' : t.historyPanel.player);

  return (
    <section className="moves" aria-label={t.historyPanel.ariaLabel}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0 }}>{t.historyPanel.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onDownload && (
            <>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  title={t.historyPanel.clearTitle}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #555', background: '#2a2a2a', color: '#fff', cursor: 'pointer' }}
                >
                  {t.historyPanel.clear}
                </button>
              )}
              <button
                type="button"
                onClick={onDownload}
                disabled={grouped.length === 0 && !hasArchive}
                title={grouped.length === 0 && !hasArchive ? t.historyPanel.noDataToDownload : t.historyPanel.downloadTitle}
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #555', background: '#222', color: '#fff', cursor: grouped.length === 0 && !hasArchive ? 'not-allowed' : 'pointer' }}
              >
                {t.historyPanel.download}
              </button>
            </>
          )}
        </div>
      </div>
      {grouped.length === 0 ? (
        <p className="muted">{t.historyPanel.noMoves}</p>
      ) : (
        <ol>
          {pageItems.map((e, i) => (
            <li key={i} className="moves__item">
              <img
                src={iconFor(e.player)}
                alt={e.player === 'L' ? t.historyPanel.lightBalls : t.historyPanel.darkBalls}
                className="moves__icon"
                style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }}
                draggable={false}
              />
              <span
                className="moves__tag"
                aria-label={`${t.historyPanel.source}: ${labelFor(e.source)}`}
                style={{ display: 'inline-block', fontSize: 12, padding: '2px 6px', borderRadius: 6, background: '#444', color: '#fff', marginRight: 6 }}
              >
                {labelFor(e.source)}
              </span>
              <span className="moves__text">{e.text}</span>
              {e.count > 1 && (
                <span className="moves__count" title={t.historyPanel.repeated.replace('{count}', String(e.count))} style={{ marginLeft: 6, opacity: 0.8 }}>×{e.count}</span>
              )}
            </li>
          ))}
        </ol>
      )}
      {!disablePagination && total > PAGE_SIZE && (
        <HistoryPagination total={total} pageSize={PAGE_SIZE} page={pageSafe} onChange={setPage} />
      )}
    </section>
  );
}
