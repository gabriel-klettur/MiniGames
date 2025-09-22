import { useEffect, useState } from 'react';
import type { TraceEvent } from './types';

/**
 * Simple ring buffer for trace events with subscription support.
 */
class TraceBuffer {
  private buf: TraceEvent[] = [];
  private max: number;
  private listeners: Array<() => void> = [];
  private _totalReceived = 0;
  private _dropped = 0;

  constructor(max = 5000) {
    this.max = Math.max(100, max);
  }

  setMax(max: number) {
    this.max = Math.max(100, Math.round(max));
    // Trim if needed
    if (this.buf.length > this.max) {
      const drop = this.buf.length - this.max;
      this.buf.splice(0, drop);
      this._dropped += drop;
      this.emit();
    }
  }

  clear() {
    this.buf = [];
    this._totalReceived = 0;
    this._dropped = 0;
    this.emit();
  }

  add(ev: TraceEvent | TraceEvent[]) {
    if (Array.isArray(ev)) {
      this._totalReceived += ev.length;
      this.buf.push(...ev);
    } else {
      this._totalReceived += 1;
      this.buf.push(ev);
    }
    const overflow = this.buf.length - this.max;
    if (overflow > 0) {
      this.buf.splice(0, overflow);
      this._dropped += overflow;
    }
    this.emit();
  }

  get(): ReadonlyArray<TraceEvent> {
    return this.buf;
  }

  stats() {
    return { total: this._totalReceived, dropped: this._dropped, size: this.buf.length, cap: this.max };
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }
}

export const traceBuffer = new TraceBuffer(5000);

/**
 * React hook to consume the trace buffer reactively.
 */
export function useTraceBuffer() {
  const [tick, setTick] = useState(0);
  useEffect(() => traceBuffer.subscribe(() => setTick((x) => x + 1)), []);
  return {
    events: traceBuffer.get(),
    stats: traceBuffer.stats(),
    clear: () => traceBuffer.clear(),
    setCap: (n: number) => traceBuffer.setMax(n),
    tick,
  } as const;
}
