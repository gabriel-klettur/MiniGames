import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export type MoveEntry = { player: 'L' | 'D'; source: 'PLAYER' | 'IA' | 'AUTO'; text: string };

export interface MoveLogProps {
  moves: MoveEntry[];
}

/**
 * MoveLog: pretty move list with player icon and source tag (Player/IA/AUTO).
 * Also compacts consecutive duplicate entries with a small counter.
 */
export default function MoveLog({ moves }: MoveLogProps) {
  type Entry = MoveEntry & { count: number };

  const grouped: Entry[] = [];

  // Group consecutive duplicates based on (source, player, text)
  for (let i = 0; i < moves.length; i++) {
    const parsed = moves[i];
    const key = `${parsed.source}|${parsed.player}|${parsed.text}`;
    const prev = grouped[grouped.length - 1];
    if (prev && `${prev.source}|${prev.player}|${prev.text}` === key) {
      prev.count += 1;
    } else {
      grouped.push({ ...parsed, count: 1 });
    }
  }

  const iconFor = (p: 'L' | 'D') => (p === 'L' ? bolaA : bolaB);
  const labelFor = (s: MoveEntry['source']) => (s === 'IA' ? 'IA' : s === 'AUTO' ? 'AUTO' : 'Jugador');

  return (
    <section className="moves" aria-label="Historial de movimientos">
      <h3>Historial</h3>
      {grouped.length === 0 ? (
        <p className="muted">Sin movimientos</p>
      ) : (
        <ol>
          {grouped.map((e, i) => (
            <li key={i} className="moves__item">
              <img
                src={iconFor(e.player)}
                alt={e.player === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
                className="moves__icon"
                style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }}
                draggable={false}
              />
              <span
                className="moves__tag"
                aria-label={`Origen: ${labelFor(e.source)}`}
                style={{ display: 'inline-block', fontSize: 12, padding: '2px 6px', borderRadius: 6, background: '#444', color: '#fff', marginRight: 6 }}
              >
                {labelFor(e.source)}
              </span>
              <span className="moves__text">{e.text}</span>
              {e.count > 1 && (
                <span className="moves__count" title={`Repetido ${e.count} veces`} style={{ marginLeft: 6, opacity: 0.8 }}>×{e.count}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
