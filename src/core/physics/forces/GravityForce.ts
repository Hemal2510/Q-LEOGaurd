import type { OrbitalState, PhysicalProperties } from '../../../models/satellite';
import type { Vector3D } from '../../math/vector';
import { magnitude, scale } from '../../math/vector';
import type { ForceModel } from './ForceModel';
import { EARTH_MU } from '../../../config/constants';

/**
 * GravityForce class.
 * Calculates standard Newtonian gravitational acceleration from a central spherical body.
 * Formula: a = - (μ / r^3) * r
 */
export class GravityForce implements ForceModel {
    readonly name = 'Central Gravity';
    public enabled = true;

    /**
     * Calculates central gravity acceleration.
     *
     * @param state Current orbital state containing the position vector r
     * @param _properties Unused for basic central gravity
     * @param _epoch Unused for central gravity
     * @returns Acceleration vector in m/s^2
     */
    calculateAcceleration(
        state: OrbitalState,
        _properties: PhysicalProperties,
        _epoch: number
    ): Vector3D {
        const r = state.position;
        const rMag = magnitude(r);

        if (rMag === 0) {
            return [0, 0, 0];
        }

        // Accel: - (mu / r^3) * r
        const scalar = -EARTH_MU / (rMag * rMag * rMag);
        return scale(r, scalar);
    }
}