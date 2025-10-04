/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { randomInitialTowers } from '../src/game/rules';

// Ellipse radii used by randomPointInEllipse in rules.ts
const A = 0.44;
const B = 0.35;

function insideEllipse(x: number, y: number): boolean {
  const dx = x - 0.5;
  const dy = y - 0.5;
  return (dx * dx) / (A * A) + (dy * dy) / (B * B) <= 1 + 1e-9;
}

describe('randomInitialTowers()', () => {
  it('creates 12 unique towers with height=1 within the ellipse', () => {
    const ts = randomInitialTowers();
    expect(ts.length).toBe(12);

    // All ids unique
    const ids = new Set(ts.map(t => t.id));
    expect(ids.size).toBe(ts.length);

    // Heights and top/stack consistency
    for (const t of ts) {
      expect(t.height).toBe(1);
      expect(t.stack.length).toBe(1);
      expect(t.top).toBe(t.stack[0]);
      expect(insideEllipse(t.pos.x, t.pos.y)).toBe(true);
      // Positions normalized
      expect(t.pos.x).toBeGreaterThanOrEqual(0);
      expect(t.pos.x).toBeLessThanOrEqual(1);
      expect(t.pos.y).toBeGreaterThanOrEqual(0);
      expect(t.pos.y).toBeLessThanOrEqual(1);
    }
  });
});
