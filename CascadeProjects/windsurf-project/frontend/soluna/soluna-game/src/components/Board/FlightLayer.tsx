import React, { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { SymbolIcon } from '../Icons';
import type { GameAction, MergeFx } from '../../game/types';

interface FlightPx {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface FlightLayerProps {
  mergeFx: MergeFx | null;
  flightPx: FlightPx | null;
  flightRunning: boolean;
  flightRef: RefObject<HTMLDivElement | null>;
  supportsMotionPath: boolean;
  curvePath?: string;
  lingerMs?: number;
  dispatch: React.Dispatch<GameAction>;
  debug?: boolean;
  tokenSize?: number;
}

export default function FlightLayer({
  mergeFx,
  flightPx,
  flightRunning,
  flightRef,
  supportsMotionPath,
  curvePath,
  lingerMs,
  dispatch,
  debug,
  tokenSize,
}: FlightLayerProps) {
  if (!mergeFx || !flightPx) return null;
  const endOnceRef = useRef(false);
  // Reset the end-once guard whenever a new flight is prepared
  // This ensures that each merge animation will trigger commit/clear exactly once
  useEffect(() => {
    endOnceRef.current = false;
  }, [mergeFx?.mergedId, mergeFx?.at]);
  const useMP = supportsMotionPath && !!curvePath;
  const half = Math.max(0, (tokenSize ?? 0) / 2);
  return (
    <div className="merge-flight-layer" key={`flight-${mergeFx.at}`}>
      <div
        className={`token-flight ${useMP ? 'mp' : ''}`}
        key={`flight-token-${mergeFx.mergedId}-${mergeFx.at}`}
        style={{ left: useMP ? (flightPx.start.x - half) : flightPx.start.x, top: useMP ? (flightPx.start.y - half) : flightPx.start.y }}
      >
        <div
          className={`token-flight-body ${useMP ? 'curve' : ''} ${flightRunning ? 'running' : ''}`}
          ref={flightRef}
          style={{
            ['--dx' as any]: `${flightPx.end.x - flightPx.start.x}px`,
            ['--dy' as any]: `${flightPx.end.y - flightPx.start.y}px`,
            ['--stack-count' as any]: mergeFx.sourceStack.length,
            ['offsetPath' as any]: useMP ? curvePath : undefined,
            ['WebkitOffsetPath' as any]: useMP ? curvePath : undefined,
          }}
          onAnimationEnd={() => {
            if (endOnceRef.current) return;
            endOnceRef.current = true;
            // First, commit the deferred merge so the destination updates immediately
            try {
              const dt = Date.now() - (mergeFx.at || Date.now());
              // eslint-disable-next-line no-console
              console.log(`[Soluna] Flight animation ended (dt ${dt}ms) — committing merge`);
            } catch {}
            dispatch({ type: 'commit-merge' });
            // Then, keep the flight overlay for 250ms to avoid flicker on some devices
            const delay = typeof lingerMs === 'number' && isFinite(lingerMs) ? Math.max(0, Math.floor(lingerMs)) : 250;
            try {
              // eslint-disable-next-line no-console
              console.log(`[Soluna] Scheduling overlay clear in ${delay}ms`);
            } catch {}
            setTimeout(() => { dispatch({ type: 'clear-merge-fx' }); }, delay);
          }}
        >
          {debug && (
            <>
              <div className="flight-debug-outline" aria-hidden="true" />
              <div className="flight-debug-center" aria-hidden="true" />
            </>
          )}
          <div className="token-inner">
            <div className="token-stack" aria-hidden="true">
              {(() => {
                const below = mergeFx!.sourceStack.slice(0, Math.max(0, mergeFx!.sourceStack.length - 1));
                const count = below.length;
                return below.slice().reverse().map((sym, i) => (
                  <div key={i} className="token-disc-img" style={{ ['--i' as any]: i + 1, zIndex: (count - i) }}>
                    <SymbolIcon type={sym} />
                  </div>
                ));
              })()}
            </div>
            <SymbolIcon type={mergeFx.sourceStack[mergeFx.sourceStack.length - 1]} />
          </div>
        </div>
      </div>
    </div>
  );
}
