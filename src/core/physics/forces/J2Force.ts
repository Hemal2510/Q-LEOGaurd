import type { OrbitalState, PhysicalProperties } from '../../../models/satellite';
import type { Vector3D } from '../../math/vector';
import { magnitude } from '../../math/vector';
import type { ForceModel } from './forceModel';
import { EARTH_MU, EARTH_J2, EARTH_RADIUS_EQUATORIAL } from '../../../config/constants';

export class J2Force implements ForceModel {
    readonly name = 'J2 Oblateness Perturbation';
    public enabled = true;

    calculateAcceleration(
        state: OrbitalState,
        _properties: PhysicalProperties,
        _epoch: number
    ): Vector3D {
        const r = state.position;
        const [x, y, z] = r;
        const rMag = magnitude(r);

        if (rMag === 0) {
            return [0, 0, 0];
        }

        const zOverR = z / rMag;
        const zOverR2 = zOverR * zOverR;

        const rMag2 = rMag * rMag;
        const rMag4 = rMag2 * rMag2;
        const reMag2 = EARTH_RADIUS_EQUATORIAL * EARTH_RADIUS_EQUATORIAL;

        const k = 1.5 * EARTH_J2 * EARTH_MU * reMag2 / rMag4;

        const ax = -k * (x / rMag) * (1 - 5 * zOverR2);
        const ay = -k * (y / rMag) * (1 - 5 * zOverR2);
        const az = -k * (z / rMag) * (3 - 5 * zOverR2);

        return [ax, ay, az];
    }
}
