import { describe, it, expect } from 'vitest';
import { createDefaultLanesByPlayer, DEFAULT_LANE_LENGTH } from '../src/game/board';

describe('board.createDefaultLanesByPlayer', () => {
  it('crea 5 carriles por jugador con longitudes correctas', () => {
    const L = DEFAULT_LANE_LENGTH;
    const lanes = createDefaultLanesByPlayer(L);

    expect(Object.keys(lanes)).toContain('Light');
    expect(Object.keys(lanes)).toContain('Dark');

    expect(lanes.Light).toHaveLength(5);
    expect(lanes.Dark).toHaveLength(5);

    for (const lane of lanes.Light) expect(lane.length).toBe(L);
    for (const lane of lanes.Dark) expect(lane.length).toBe(L);
  });

  it('usa los patrones de velocidad documentados', () => {
    const lanes = createDefaultLanesByPlayer(DEFAULT_LANE_LENGTH);

    const lightOut = lanes.Light.map(l => l.speedOut);
    const lightBack = lanes.Light.map(l => l.speedBack);
    const darkOut = lanes.Dark.map(l => l.speedOut);
    const darkBack = lanes.Dark.map(l => l.speedBack);

    expect(lightOut).toEqual([3, 1, 2, 1, 3]);
    expect(lightBack).toEqual([1, 3, 2, 3, 1]);
    expect(darkOut).toEqual([1, 3, 2, 3, 1]);
    expect(darkBack).toEqual([3, 1, 2, 1, 3]);
  });
});
