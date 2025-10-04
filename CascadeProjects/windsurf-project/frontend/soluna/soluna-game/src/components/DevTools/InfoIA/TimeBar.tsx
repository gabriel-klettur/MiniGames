import React from 'react';

export interface TimeBarProps {
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
}

const TimeBar: React.FC<TimeBarProps> = ({ moveIndex, moveElapsedMs, moveTargetMs }) => {
  const ratio = moveTargetMs && moveTargetMs > 0 ? Math.min(1, moveElapsedMs / moveTargetMs) : 0;
  return (
    <div className="timebar" style={{ marginTop: 8 }}>
      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <span className="kpi"><strong>Jugada</strong> {moveIndex}</span>
        <div style={{ position: 'relative', height: 10, flex: 1, background: '#1e1e1e', border: '1px solid #444', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ratio * 100}%`, background: '#2a6bcc', transition: 'width 80ms linear' }} />
        </div>
        <span className="kpi"><strong>t</strong> {(moveElapsedMs/1000).toFixed(2)}s{moveTargetMs ? `/${(moveTargetMs/1000).toFixed(2)}s` : ''}</span>
      </div>
    </div>
  );
};

export default TimeBar;
