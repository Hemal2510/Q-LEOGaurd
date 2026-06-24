import type { OrbitalState, PhysicalProperties } from '../../../models/satellite';
import type { Vector3D } from '../../math/vector';
import { magnitude, scale, subtract } from '../../math/vector';
import type { ForceModel } from './forceModel';
import { EARTH_RADIUS } from '../../../config/constants';

const EARTH_ROTATION_RATE = 7.2921150e-5;

const DENSITY_LAYERS = [
    { altMin: 200,  altMax: 300,      rho0: 2.789e-10, H: 37.105 },
    { altMin: 300,  altMax: 400,      rho0: 2.418e-11, H: 53.628 },
    { altMin: 400,  altMax: 500,      rho0: 3.725e-12, H: 58.515 },
    { altMin: 500,  altMax: 700,      rho0: 6.967e-13, H: 63.822 },
    { altMin: 700,  altMax: 1000,     rho0: 3.614e-14, H: 88.667 },
    { altMin: 1000, altMax: Infinity, rho0: 3.019e-15, H: 268.00 },
];

export class AtmosphericDragForce implements ForceModel {
    readonly name = 'Atmospheric Drag';
    public enabled = true;

    calculateAcceleration(
        state: OrbitalState,
        properties: PhysicalProperties,
        _epoch: number
    ): Vector3D {
        const mass = properties.mass ?? 100;
        const dragCoefficient = properties.dragCoefficient ?? 2.2;
        const crossSectionArea = properties.crossSectionArea ?? 1.0;

        const altitudeKm =
            (magnitude(state.position) - EARTH_RADIUS) / 1000;

        if (altitudeKm < 0 || altitudeKm > 1000) {
            return [0, 0, 0];
        }

        const layer = DENSITY_LAYERS.find(
            (l) => altitudeKm >= l.altMin && altitudeKm < l.altMax
        );

        if (!layer) {
            return [0, 0, 0];
        }

        const rho =
            layer.rho0 *
            Math.exp(-(altitudeKm - layer.altMin) / layer.H);

        const vAtm: Vector3D = [
            -EARTH_ROTATION_RATE * state.position[1],
             EARTH_ROTATION_RATE * state.position[0],
             0,
        ];

        const vRel = subtract(state.velocity, vAtm);
        const vRelMag = magnitude(vRel);

        if (vRelMag === 0) {
            return [0, 0, 0];
        }

        const scalar =
            -0.5 *
            rho *
            (dragCoefficient * crossSectionArea / mass) *
            vRelMag;

        return scale(vRel, scalar);
    }
}
