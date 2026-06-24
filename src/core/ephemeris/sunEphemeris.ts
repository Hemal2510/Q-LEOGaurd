import type { Vector3D } from '../math/vector';

const AU = 149_597_870_700; // meters
const YEAR_SECONDS = 365.25 * 86400;

/**
 * Returns Earth -> Sun position vector.
 * Simple circular analytical model.
 */
export function getSunPosition(epoch: number): Vector3D {
    const theta =
        (2 * Math.PI * epoch) /
        YEAR_SECONDS;

    return [
        AU * Math.cos(theta),
        AU * Math.sin(theta),
        0,
    ];
}