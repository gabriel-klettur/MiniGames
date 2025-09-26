import { timebarTitle } from '../utils/aria';

export interface TimeBarProps {
  ratio: number; // 0..1
  busy: boolean;
  isOver: boolean;
  shownElapsedMs: number;
  limitMs?: number;
}

export default function TimeBar({ ratio, busy, isOver, shownElapsedMs, limitMs }: TimeBarProps) {
  return (
    <div className="ia-panel__timebar" aria-label="Progreso de tiempo">
      <div
        className="timebar"
        data-busy={busy}
        data-over={isOver}
        title={timebarTitle(shownElapsedMs, limitMs)}
      >
        <div className="timebar__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="timebar__meta">
        <span>{(shownElapsedMs / 1000).toFixed(2)} s</span>
        <span>{typeof limitMs === 'number' ? (limitMs / 1000).toFixed(2) + ' s' : '∞'}</span>
      </div>
    </div>
  );
}

