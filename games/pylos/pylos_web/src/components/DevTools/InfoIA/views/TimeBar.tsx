type TimeBarProps = {
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
};

export default function TimeBar({ moveIndex, moveElapsedMs, moveTargetMs }: TimeBarProps) {
  return (
    <div className="ia-panel__timebar" role="status" aria-live="polite">
      <div
        className="timebar"
        data-busy={true}
        data-over={!!moveTargetMs && moveElapsedMs >= moveTargetMs}
        data-auto={moveTargetMs == null}
      >
        <div
          className="timebar__fill"
          style={moveTargetMs != null ? { width: `${Math.min(100, (moveElapsedMs / (moveTargetMs || 1)) * 100).toFixed(2)}%` } : undefined}
        />
      </div>
      <div className="timebar__meta">
        <span>Jugada #{moveIndex}</span>
        <span>
          {`${(moveElapsedMs / 1000).toFixed(3)} s`}
          {moveTargetMs != null ? ` / ${(moveTargetMs / 1000).toFixed(3)} s` : ' (Auto)'}
        </span>
      </div>
    </div>
  );
}
