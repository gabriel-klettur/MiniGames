
export interface TimeBarProps {
  limitMs: number | null;
  shownElapsedMs: number;
  ratio: number; // 0..1
  isOver: boolean;
}

export function TimeBar({ limitMs, shownElapsedMs, ratio, isOver }: TimeBarProps) {
  const title = typeof limitMs === 'number'
    ? `${(shownElapsedMs / 1000).toFixed(1)}s / ${(limitMs / 1000).toFixed(1)}s`
    : 'Sin límite';

  return (
    <div
      className="ia-timebar"
      aria-label="Progreso de tiempo"
      title={title}
      style={{
        position: 'relative',
        height: 10,
        background: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: 6,
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      <div
        className="ia-timebar__fill"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${ratio * 100}%`,
          transition: 'width 120ms linear',
          background: isOver ? '#7a1f1f' : '#2a6bcc',
        }}
      />
    </div>
  );
}

export default TimeBar;
