import type { Vector3D } from '../math/vector';
import { ASTRONOMICAL_UNIT } from '../../config/constants';

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
        ASTRONOMICAL_UNIT * Math.cos(theta),
        ASTRONOMICAL_UNIT * Math.sin(theta),
        0,
    ];
}