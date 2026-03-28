let pool: Worker[] = [];

function createWorker(): Worker {
  return new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
}

export function getWorkers(count: number): Worker[] {
  // Grow pool if needed
  while (pool.length < count) {
    pool.push(createWorker());
  }
  // Shrink pool if too large
  if (pool.length > count) {
    const extra = pool.splice(count);
    for (const w of extra) {
      try { w.terminate(); } catch {}
    }
  }
  return pool;
}

export function resetPool(): void {
  for (const w of pool) {
    try { w.terminate(); } catch {}
  }
  pool = [];
}
