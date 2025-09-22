import type { Wall } from './types.ts';

/** Valida que la valla esté dentro del rango del tablero (índices de vallas). */
export function wallInBounds(size: number, w: Wall): boolean {
  // Con nuestro esquema, tanto H como V usan r,c en 0..size-2
  return w.r >= 0 && w.r <= size - 2 && w.c >= 0 && w.c <= size - 2;
}

/** Devuelve true si la valla candidata se solapa exactamente con una existente. */
export function overlaps(walls: Wall[], cand: Wall): boolean {
  // En Quoridor, una valla ocupa 2 segmentos contiguos.
  // Representamos cada valla por su "inicio" (r,c). Por tanto, dos vallas de la
  // misma orientación se solapan si comparten cualquiera de los 2 segmentos.
  // Eso ocurre cuando sus inicios están a distancia 0 o 1 a lo largo de la orientación,
  // y alineados en la otra coordenada.
  if (cand.o === 'H') {
    // Horizontal: misma fila r, y c en {cand.c-1, cand.c, cand.c+1} implica compartir segmento
    return walls.some(
      (w) => w.o === 'H' && w.r === cand.r && (w.c === cand.c - 1 || w.c === cand.c || w.c === cand.c + 1)
    );
  }
  // Vertical: misma columna c, y r en {cand.r-1, cand.r, cand.r+1}
  return walls.some(
    (w) => w.o === 'V' && w.c === cand.c && (w.r === cand.r - 1 || w.r === cand.r || w.r === cand.r + 1)
  );
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

