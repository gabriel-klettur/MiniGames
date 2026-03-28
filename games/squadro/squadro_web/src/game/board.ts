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
): Record<Player, Lane[]> {
  // Align logical speeds with the visual pip markers rendered on the board:
  // - Light (horizontal) starts at the right edge and goes left (out), then returns right (back).
  //   Right edge pips per row r1..r5: 3,1,2,1,3  => speedOut
  //   Left edge pips per row r1..r5:  1,3,2,3,1  => speedBack
  // - Dark (vertical) starts at the bottom edge and goes up (out), then returns down (back).
  //   Bottom pips per col c1..c5:     1,3,2,3,1  => speedOut
  //   Top pips per col c1..c5:        3,1,2,1,3  => speedBack
  const lightOut = [3, 1, 2, 1, 3];
  const lightBack = [1, 3, 2, 3, 1];
  const darkOut = [1, 3, 2, 3, 1];
  const darkBack = [3, 1, 2, 1, 3];

  return {
    Light: createPlayerLanes(length, lightOut, lightBack),
    Dark: createPlayerLanes(length, darkOut, darkBack),
  };
}

