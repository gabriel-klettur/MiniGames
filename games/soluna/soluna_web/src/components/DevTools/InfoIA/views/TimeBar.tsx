import React from 'react';

export interface TimeBarProps {
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
}

const TimeBar: React.FC<TimeBarProps> = ({ moveIndex, moveElapsedMs, moveTargetMs }) => {
  const hasTarget = !!(moveTargetMs && moveTargetMs > 0);
  const ratio = hasTarget ? Math.min(1, moveElapsedMs / (moveTargetMs as number)) : 0;
  return (
    <div className="timebar" style={{ marginTop: 8 }}>
      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <span className="kpi"><strong>Jugada</strong> {moveIndex}</span>
        <div className="timebar__track">
          {hasTarget ? (
            <div className="timebar__fill" style={{ width: `${ratio * 100}%` }} />
          ) : (
            <div className="timebar__indeterminate" />
          )}
        </div>
        <span className="kpi"><strong>t</strong> {(moveElapsedMs/1000).toFixed(2)}s{hasTarget ? `/${((moveTargetMs as number)/1000).toFixed(2)}s` : ''}</span>
      </div>
    </div>
  );
};

export default TimeBar;
