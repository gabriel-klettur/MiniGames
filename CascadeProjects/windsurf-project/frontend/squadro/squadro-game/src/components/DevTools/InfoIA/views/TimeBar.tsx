import React from 'react';

export interface TimeBarProps {
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
}

const TimeBar: React.FC<TimeBarProps> = ({ moveIndex, moveElapsedMs, moveTargetMs }) => {
  const ratio = moveTargetMs && moveTargetMs > 0 ? Math.min(1, moveElapsedMs / moveTargetMs) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-neutral-300">
          <strong className="font-semibold">Jugada</strong>
          <span className="font-mono">{moveIndex}</span>
        </span>
        <div className="relative h-2 flex-1 rounded-md border border-neutral-700 bg-neutral-900 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-blue-600 transition-[width] duration-100 ease-linear"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-300 font-mono">
          <strong className="font-semibold">t</strong>
          {(moveElapsedMs/1000).toFixed(2)}s{moveTargetMs ? `/${(moveTargetMs/1000).toFixed(2)}s` : ''}
        </span>
      </div>
    </div>
  );
};

export default TimeBar;
