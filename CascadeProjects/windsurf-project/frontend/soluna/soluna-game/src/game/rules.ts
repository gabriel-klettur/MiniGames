import type { SymbolType, Tower } from './types';

const SYMBOLS: SymbolType[] = ['sol', 'luna', 'estrella', 'fugaz'];

function id(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Generate random points inside a centered ellipse within [0..1]x[0..1]
// ellipse radii (relative): a (x-radius), b (y-radius)
// Slightly larger radii so we have more area to spread tokens while keeping safe margins
function randomPointInEllipse(a = 0.44, b = 0.35): { x: number; y: number } {
  // Rejection sampling within bounding box
  for (let tries = 0; tries < 5000; tries++) {
    const x = Math.random();
    const y = Math.random();
    const dx = x - 0.5;
    const dy = y - 0.5;
    if ((dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1) return { x, y };
  }
  return { x: 0.5, y: 0.5 };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function randomInitialTowers(): Tower[] {
  const towers: Tower[] = [];
  const placed: { x: number; y: number }[] = [];
  const minDist = 0.14; // increased separation to avoid clusters in normalized space
  for (let i = 0; i < 12; i++) {
    const top = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const stack: SymbolType[] = [top];
    let p: { x: number; y: number } | null = null;
    for (let tries = 0; tries < 2000; tries++) {
      const cand = randomPointInEllipse();
      if (placed.every((q) => dist(q, cand) > minDist)) {
        p = cand;
        break;
      }
    }
    if (!p) p = randomPointInEllipse();
    placed.push(p);
    towers.push({ id: id(), stack, height: 1, top, pos: p });
  }
  return towers;
}

export function canMerge(a: Tower, b: Tower): boolean {
  if (a.id === b.id) return false;
  // Regla: se puede fusionar si
  //  - tienen el mismo símbolo, o
  //  - tienen la misma altura (incluida altura 1: las fichas sin agrupar pueden apilarse entre sí)
  const sameHeight = a.height === b.height;
  const sameSymbol = a.top === b.top;
  return sameHeight || sameSymbol;
}

export function mergeTowers(source: Tower, target: Tower): Tower {
  // Source goes on top of target
  const stack = [...target.stack, ...source.stack];
  const height = stack.length;
  const top = source.top; // top after placing source on top is source.top
  return { id: id(), stack, height, top, pos: { ...target.pos } };
}

export function anyValidMoves(towers: Tower[]): boolean {
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      if (canMerge(towers[i], towers[j]) || canMerge(towers[j], towers[i])) {
        return true;
      }
    }
  }
  return false;
}

export function findById(towers: Tower[], id: string): Tower | undefined {
  return towers.find(t => t.id === id);
}

export function replaceAfterMerge(towers: Tower[], sourceId: string, targetId: string, merged: Tower): Tower[] {
  return towers.filter(t => t.id !== sourceId && t.id !== targetId).concat(merged);
}
