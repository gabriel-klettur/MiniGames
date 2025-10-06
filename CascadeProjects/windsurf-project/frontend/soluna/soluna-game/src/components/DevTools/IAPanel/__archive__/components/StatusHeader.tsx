import React from 'react';

interface StatusHeaderProps {
  moving?: boolean;
  busy?: boolean;
  progress?: { depth: number; score: number } | null;
  busyElapsedMs?: number;
}

export function StatusHeader({ moving = false, busy = false, progress = null }: StatusHeaderProps) {
  return (
    <div className="ia-panel__header">
      <div className="ia-panel__status">
        {moving && (
          <span className="kpi kpi--accent" aria-live="polite">Moviendo</span>
        )}
        {busy && !moving && (
          <span className="kpi">Pensando…{progress ? ` d${progress.depth}` : ''}</span>
        )}
        {!busy && !moving && (
          <span className="kpi kpi--muted">En espera</span>
        )}
      </div>
    </div>
  );
}

export default StatusHeader;
