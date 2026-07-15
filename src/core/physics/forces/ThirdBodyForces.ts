import type { ForceModel } from "./ForceModel";
import type { OrbitalState, PhysicalProperties } from '../../../models/satellite';
import {
    type Vector3D,
    subtract,
    scale,
    magnitude
} from "../../math/vector";
import { SUN_MU, MOON_MU } from "../../../config/constants";
import { getMoonPosition } from "../../ephemeris/moonEphemeris";
import { getSunPosition } from "../../ephemeris/sunEphemeris";

/*
 * Gravitational perturbation force on a satellite due to the Sun and Moon.
 *
 * Formula:
 *     d      = rBody - rSat
 *     aPert  = μ₃ × ( d/|d|³ - rBody/|rBody|³ )
 *
 * Term 1:
 *     Direct pull of Sun/Moon on the satellite
 *
 * Term 2:
 *     Pull of Sun/Moon on Earth's center
 *
 * Result:
 *     Net third-body perturbation acceleration in ECI frame
 */
function tidalAcceleration(
    rBody: Vector3D,
    rSat: Vector3D,
    muBody: number
): Vector3D {

    const d = subtract(rBody, rSat);

    const dMag = magnitude(d);
    const rBodyMag = magnitude(rBody);

    // Prevent division by zero
    if (dMag === 0 || rBodyMag === 0) {
        return [0, 0, 0];
    }

    const aDirect = scale(
        d,
        muBody / Math.pow(dMag, 3)
    );

    const aReference = scale(
        rBody,
        muBody / Math.pow(rBodyMag, 3)
    );

    return subtract(aDirect, aReference);
}

export class SunGravityForce implements ForceModel {

    readonly name = "Sun Third-Body Gravity";
    enabled = true;

    calculateAcceleration(
        state: OrbitalState,
        _properties: PhysicalProperties,
        epoch: number
    ): Vector3D {

        const rSat = state.position;

        const rSun = getSunPosition(epoch);

        return tidalAcceleration(
            rSun,
            rSat,
            SUN_MU
        );
    }
}

export class MoonGravityForce implements ForceModel {

    readonly name = "Moon Third-Body Gravity";
    enabled = true;

    calculateAcceleration(
        state: OrbitalState,
        _properties: PhysicalProperties,
        epoch: number
    ): Vector3D {

        const rSat = state.position;

        const rMoon = getMoonPosition(epoch);

        return tidalAcceleration(
            rMoon,
            rSat,
            MOON_MU
        );
    }
}
