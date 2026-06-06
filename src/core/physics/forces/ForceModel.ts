import type { OrbitalState, PhysicalProperties } from '../../../models/satellite';
import type { Vector3D } from '../../math/vector';

/**
 * Interface representing a force model plugin for the orbital propagator.
 * To add a new perturbation force (e.g. J2, Drag, solar radiation), implement
 * this interface and add the instance to the propagator's active forces array.
 */
export interface ForceModel {
    /**
     * Unique name of the force model (used for identification in configuration and UI).
     */
    readonly name: string;

    /**
     * Controls whether this force model is active during propagation.
     * Can be toggled dynamically from the user interface.
     */
    enabled: boolean;

    /**
     * Calculates the acceleration vector acting on the satellite.
     *
     * @param state The current orbital state (position, velocity, epoch) of the satellite
     * @param properties Physical attributes of the satellite (mass, cross-sectional area, drag coeff)
     * @param epoch Current simulation time epoch in seconds
     * @returns Acceleration vector [ax, ay, az] in m/s^2 (expressed in ECI frame)
     */
    calculateAcceleration(
        state: OrbitalState,
        properties: PhysicalProperties,
        epoch: number
    ): Vector3D;
}