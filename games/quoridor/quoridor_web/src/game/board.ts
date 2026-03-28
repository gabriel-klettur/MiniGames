import type { Coord, Wall } from './types.ts';

const key = (r: number, c: number) => `${r},${c}`;

function inBounds(size: number, r: number, c: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

/**
 * Construye un conjunto de aristas bloqueadas por las vallas.
 * Usamos claves no dirigidas "r1,c1|r2,c2" (ordenadas) para representar aristas bloqueadas.
 */
function blockedEdges(size: number, walls: Wall[]): Set<string> {
  const blocked = new Set<string>();
  const edge = (a: Coord, b: Coord) => {
    const k = [key(a.row, a.col), key(b.row, b.col)].sort().join('|');
    blocked.add(k);
  };

  for (const w of walls) {
    if (w.o === 'H') {
      // Bloquea el paso vertical entre filas w.r y w.r+1 en columnas w.c y w.c+1
      const r = w.r; const c = w.c;
      if (inBounds(size, r, c)) {
        // (r,c) <-> (r+1,c)
        if (inBounds(size, r + 1, c)) edge({ row: r, col: c }, { row: r + 1, col: c });
      }
      if (inBounds(size, r, c + 1)) {
        // (r,c+1) <-> (r+1,c+1)
        if (inBounds(size, r + 1, c + 1)) edge({ row: r, col: c + 1 }, { row: r + 1, col: c + 1 });
      }
    } else {
      // Vertical: bloquea el paso horizontal entre columnas w.c y w.c+1 en filas w.r y w.r+1
      const r = w.r; const c = w.c;
      if (inBounds(size, r, c)) {
        // (r,c) <-> (r,c+1)
        if (inBounds(size, r, c + 1)) edge({ row: r, col: c }, { row: r, col: c + 1 });
      }
      if (inBounds(size, r + 1, c)) {
        // (r+1,c) <-> (r+1,c+1)
        if (inBounds(size, r + 1, c + 1)) edge({ row: r + 1, col: c }, { row: r + 1, col: c + 1 });
      }
    }
  }
  return blocked;
}

/** Devuelve los vecinos ortogonales disponibles considerando vallas. */
export function neighbors(size: number, r: number, c: number, walls: Wall[]): Coord[] {
  const blocked = blockedEdges(size, walls);
  const res: Coord[] = [];
  const tryAdd = (nr: number, nc: number) => {
    if (!inBounds(size, nr, nc)) return;
    const k = [key(r, c), key(nr, nc)].sort().join('|');
    if (!blocked.has(k)) res.push({ row: nr, col: nc });
  };
  tryAdd(r - 1, c); // up
  tryAdd(r + 1, c); // down
  tryAdd(r, c - 1); // left
  tryAdd(r, c + 1); // right
  return res;
}

/** BFS para comprobar si hay camino desde start hasta cualquier celda de la fila objetivo. */
export function hasPathToRow(size: number, walls: Wall[], start: Coord, goalRow: number): boolean {
  const q: Coord[] = [start];
  const seen = new Set<string>([key(start.row, start.col)]);
  while (q.length) {
    const cur = q.shift()!;
    if (cur.row === goalRow) return true;
    for (const nb of neighbors(size, cur.row, cur.col, walls)) {
      const k = key(nb.row, nb.col);
      if (!seen.has(k)) {
        seen.add(k);
        q.push(nb);
      }
    }
  }
  return false;
}

