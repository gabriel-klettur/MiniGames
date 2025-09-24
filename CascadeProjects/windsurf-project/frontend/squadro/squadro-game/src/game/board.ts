import type { Lane, Player } from './types';

// Default size of the Squadro board lanes (0..length)
// Adjust to match your visual board. Using 6 gives 7 intersections per lane.
export const DEFAULT_LANE_LENGTH = 6;

/**
 * Build a set of 5 lanes for a player with parameterized speeds.
 * The arrays must have length 5, one per lane index 0..4.
 */
export function createPlayerLanes(
  length: number,
  speedsOut: number[],
  speedsBack: number[],
): Lane[] {
  if (speedsOut.length !== 5 || speedsBack.length !== 5) {
    throw new Error('Expected 5 speeds for out/back');
  }
  return speedsOut.map((sOut, i) => ({
    length,
    speedOut: sOut,
    speedBack: speedsBack[i],
  }));
}

/**
 * Create symmetric lanes for both players. By default uses a mild pyramid
 * pattern that is easy to visualize. Replace with real board values later.
 */
export function createDefaultLanesByPlayer(
  length: number = DEFAULT_LANE_LENGTH,
  speedsOut: number[] = [1, 2, 3, 2, 1],
  speedsBack: number[] = [3, 2, 1, 2, 3],
): Record<Player, Lane[]> {
  return {
    Light: createPlayerLanes(length, speedsOut, speedsBack),
    Dark: createPlayerLanes(length, speedsOut, speedsBack),
  };
}

