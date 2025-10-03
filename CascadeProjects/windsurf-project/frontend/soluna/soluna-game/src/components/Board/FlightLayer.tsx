import React from 'react';
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
  curveEnabled: boolean;
  dispatch: React.Dispatch<GameAction>;
}

export default function FlightLayer({
  mergeFx,
  flightPx,
  flightRunning,
  flightRef,
  supportsMotionPath,
  curvePath,
  curveEnabled,
  dispatch,
}: FlightLayerProps) {
  if (!mergeFx || !flightPx) return null;
  return (
    <div className="merge-flight-layer" key={`flight-${mergeFx.at}`}>
      <div
        className="token-flight"
        key={`flight-token-${mergeFx.mergedId}-${mergeFx.at}`}
        style={{ left: flightPx.start.x, top: flightPx.start.y }}
      >
        <div
          className={`token-flight-body ${supportsMotionPath && curveEnabled && curvePath ? 'curve' : ''} ${flightRunning ? 'running' : ''}`}
          ref={flightRef}
          style={{
            ['--dx' as any]: `${flightPx.end.x - flightPx.start.x}px`,
            ['--dy' as any]: `${flightPx.end.y - flightPx.start.y}px`,
            ['--stack-count' as any]: mergeFx.sourceStack.length,
            ['offsetPath' as any]: supportsMotionPath && curveEnabled && curvePath ? curvePath : undefined,
            ['WebkitOffsetPath' as any]: supportsMotionPath && curveEnabled && curvePath ? curvePath : undefined,
          }}
          onAnimationEnd={() => { dispatch({ type: 'clear-merge-fx' }); }}
        >
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
