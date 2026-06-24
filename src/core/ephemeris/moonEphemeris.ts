import type { Vector3D } from '../math/vector';

const MOON_DISTANCE = 384_400_000; // meters
const MOON_PERIOD = 27.321661 * 86400;

/**
 * Returns Earth -> Moon position vector.
 * Simple circular analytical model.
 */
export function getMoonPosition(epoch: number): Vector3D {
    const theta =
        (2 * Math.PI * epoch) /
        MOON_PERIOD;

    return [
        MOON_DISTANCE * Math.cos(theta),
        MOON_DISTANCE * Math.sin(theta),
        0,
    ];
}