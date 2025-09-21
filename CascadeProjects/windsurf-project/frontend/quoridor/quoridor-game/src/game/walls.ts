import type { Wall } from './types.ts';

/** Valida que la valla esté dentro del rango del tablero (índices de vallas). */
export function wallInBounds(size: number, w: Wall): boolean {
  // Con nuestro esquema, tanto H como V usan r,c en 0..size-2
  return w.r >= 0 && w.r <= size - 2 && w.c >= 0 && w.c <= size - 2;
}

/** Devuelve true si la valla candidata se solapa exactamente con una existente. */
export function overlaps(walls: Wall[], cand: Wall): boolean {
  return walls.some((w) => w.o === cand.o && w.r === cand.r && w.c === cand.c);
}

/** Devuelve true si la valla candidata cruza a 90° con una existente en el mismo punto (no permitido). */
export function crosses(walls: Wall[], cand: Wall): boolean {
  // Con el esquema adoptado, el cruce se da cuando comparten r,c y difieren en orientación
  return walls.some((w) => w.o !== cand.o && w.r === cand.r && w.c === cand.c);
}

/** Comprobación básica de colocación (no incluye validación de caminos). */
export function canPlaceWallBasic(size: number, walls: Wall[], cand: Wall): boolean {
  if (!wallInBounds(size, cand)) return false;
  if (overlaps(walls, cand)) return false;
  if (crosses(walls, cand)) return false;
  return true;
}

