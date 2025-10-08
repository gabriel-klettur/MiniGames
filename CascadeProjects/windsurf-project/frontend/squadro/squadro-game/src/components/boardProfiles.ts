import type { Orientation } from '../game/types';
import boardClassic from '../assets/board_classic.png';
import boardBga from '../assets/board_bga.png';

/**
 * BoardProfile — describes how to render a board skin and how to map
 * logical intersections to pixel space. The simple base below assumes
 * a uniform grid with constant pitch and a top-left origin offset.
 */
export interface BoardProfile {
  key: Orientation;
  /** Image used as the board background */
  image: string;
  /**
   * Compute the distance (in px) between adjacent intersections.
   * For the current grid-based layout, a good default is (cellPx + gap).
   */
  getPitch: (cellPx: number, gap: number) => number;
  /**
   * Compute the pixel origin for intersection (row=0, col=0).
   * Caller may pass a safety margin to prevent clipping.
   */
  getOrigin: (edgeSafePx: number) => { x: number; y: number };
  /** Optional flips if the underlying artwork is mirrored vs logic */
  flip?: { horizontal?: boolean; vertical?: boolean };
}

const basePitch = (cellPx: number, gap: number) => cellPx + gap;
const baseOrigin = (edgeSafePx: number) => ({ x: edgeSafePx, y: edgeSafePx });

const classic: BoardProfile = {
  key: 'classic',
  image: boardClassic,
  getPitch: basePitch,
  getOrigin: baseOrigin,
};

const bga: BoardProfile = {
  key: 'bga',
  image: boardBga,
  getPitch: basePitch,
  getOrigin: baseOrigin,
  // If later we detect the art is mirrored, we can set flips here.
  flip: { horizontal: false, vertical: false },
};

export const boardProfiles: Record<Orientation, BoardProfile> = {
  classic,
  bga,
};

export function getBoardProfile(orientation: Orientation): BoardProfile {
  return boardProfiles[orientation] ?? classic;
}
