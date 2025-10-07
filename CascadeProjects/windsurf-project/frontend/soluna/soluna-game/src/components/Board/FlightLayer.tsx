import React, { useEffect, useRef, useState } from 'react';
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
  // Progress-driven debug: show how the destination tower grows while the source stack flies
  const [arrivedCount, setArrivedCount] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const durationMsRef = useRef<number>(1250);
  // Initialize progress tracking when the flight starts running
  useEffect(() => {
    if (!debug) return; // Only in debug mode
    if (!flightRunning || !flightRef.current) {
      // Reset when flight not running
      setArrivedCount(0);
      if (rafIdRef.current != null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
      startTsRef.current = null;
      return;
    }
    // Read CSS --flight-duration (supports 'ms' and 's')
    try {
      const cs = getComputedStyle(flightRef.current);
      const raw = (cs.getPropertyValue('--flight-duration') || '').trim();
      let ms = 1250;
      if (raw.endsWith('ms')) ms = parseFloat(raw);
      else if (raw.endsWith('s')) ms = parseFloat(raw) * 1000;
      else if (raw) ms = parseFloat(raw) || 1250;
      durationMsRef.current = Number.isFinite(ms) ? Math.max(200, ms) : 1250;
    } catch { durationMsRef.current = 1250; }
    startTsRef.current = performance.now();
    const total = mergeFx.sourceStack.length;
    const tick = () => {
      const t0 = startTsRef.current ?? performance.now();
      const p = Math.max(0, Math.min(1, (performance.now() - t0) / Math.max(1, durationMsRef.current)));
      const arrived = Math.min(total, Math.floor(p * total));
      setArrivedCount(arrived);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => { if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; };
  }, [debug, flightRunning, flightRef, mergeFx?.sourceStack.length]);
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
            // Ensure growth overlay shows full arrival (excluding top disc) at the very end in debug
            try {
              if (debug) {
                const sourceBelowCount = Math.max(0, mergeFx.sourceStack.length - 1);
                setArrivedCount(sourceBelowCount);
              }
            } catch {}
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
        {/* Debug-only: stack growth visualization at destination */}
        {debug && (
          <div
            className="stack-growth-overlay"
            style={{
              position: 'absolute',
              left: useMP ? (flightPx.end.x - half) : flightPx.end.x,
              top: useMP ? (flightPx.end.y - half) : flightPx.end.y,
              width: tokenSize,
              height: tokenSize,
              transform: useMP ? undefined : 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          >
            {(() => {
              // Compute target base (pre-merge) and progressive arriving (excluding the top disc which is the flying head)
              const merged = mergeFx.towersAfter.find(t => t.id === mergeFx.mergedId);
              const finalH = merged?.height ?? mergeFx.sourceStack.length; // fallback
              const finalStack = merged?.stack ?? mergeFx.sourceStack; // fallback
              const sourceBelowCount = Math.max(0, mergeFx.sourceStack.length - 1);
              const baseH = Math.max(0, finalH - mergeFx.sourceStack.length);
              const baseSyms = finalStack.slice(0, baseH);
              const n = Math.max(0, Math.min(arrivedCount, sourceBelowCount));
              const arrivingSyms = mergeFx.sourceStack.slice(0, n); // bottom-first (no top)
              const totalBelowCount = baseH + Math.max(0, (finalH - 1));
              return (
                <>
                  {/* Base stack (pre-merge target), tinted and under arriving discs */}
                  <div className="token-stack" aria-hidden="true" style={{ opacity: 0.7, filter: 'grayscale(0.85) brightness(0.95)' }}>
                    {baseSyms.slice().reverse().map((sym, i) => (
                      <div
                        key={`base-${i}`}
                        className="token-disc-img"
                        style={{
                          ['--i' as any]: i + 1,
                          zIndex: (baseH - i),
                        }}
                      >
                        <SymbolIcon type={sym} />
                      </div>
                    ))}
                  </div>
                  {/* Arriving discs (source without head), stacked on top of base */}
                  <div className="token-stack" aria-hidden="true" style={{ opacity: 0.9 }}>
                    {arrivingSyms.map((sym, j) => (
                      <div
                        key={`arr-${j}`}
                        className="token-disc-img stack-up"
                        style={{
                          ['--i' as any]: j + 1,
                          zIndex: (totalBelowCount - (baseH + j)),
                          opacity: 0.9,
                          filter: 'drop-shadow(0 2px 6px rgba(255,165,0,0.35))',
                        }}
                      >
                        <SymbolIcon type={sym} />
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
