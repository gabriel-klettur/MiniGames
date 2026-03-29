import type { Concept, Category, Difficulty } from './types';

/** Fisher-Yates shuffle (returns new array) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick `count` random items from `arr`, excluding `excludeIds`. */
export function pickDistractors(
  pool: readonly Concept[],
  excludeId: string,
  count: number,
): Concept[] {
  const candidates = pool.filter((c) => c.id !== excludeId);
  return shuffle(candidates).slice(0, count);
}

/** Filter concepts by optional category and difficulty. */
export function filterConcepts(
  concepts: readonly Concept[],
  categories?: Category[],
  difficulties?: Difficulty[],
): Concept[] {
  let result = [...concepts];
  if (categories?.length) {
    result = result.filter((c) => categories.includes(c.category));
  }
  if (difficulties?.length) {
    result = result.filter((c) => difficulties.includes(c.difficulty));
  }
  return result;
}

let _counter = 0;

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${_counter++}`;
}
