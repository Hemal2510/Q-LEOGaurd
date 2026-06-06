import type { OrbitalState, PhysicalProperties } from '../../models/satellite';
import type { Vector3D } from '../math/vector';
import { add, scale } from '../math/vector';
import type { ForceModel } from './forces/forceModel';

interface StateDerivatives {
    velocity: Vector3D;
    acceleration: Vector3D;
}

/**
 * Calculates the state derivatives (velocity and acceleration) for a given orbital state.
 * Sums acceleration vectors from all enabled ForceModel plugins.
 */
function getDerivatives(
    position: Vector3D,
    velocity: Vector3D,
    properties: PhysicalProperties,
    epoch: number,
    forces: ForceModel[]
): StateDerivatives {
    // Create a temporary state interface for the force calculations
    const tempState: OrbitalState = { position, velocity, epoch };

    let totalAcceleration: Vector3D = [0, 0, 0];

    for (const force of forces) {
        if (force.enabled) {
            const acc = force.calculateAcceleration(tempState, properties, epoch);
            totalAcceleration = add(totalAcceleration, acc);
        }
    }

    return {
        velocity,
        acceleration: totalAcceleration
    };
}

/**
 * Propagates a satellite's state by time step dt using a 4th-order Runge-Kutta numerical integrator.
 * Sums accelerations dynamically from the active ForceModel plugins.
 *
 * @param state Current orbital state
 * @param properties Physical properties of the satellite (mass, drag area, etc.)
 * @param dt Time step in seconds (can be positive or negative)
 * @param forces Array of registered force model plugins
 * @returns The new orbital state at epoch + dt
 */
export function propagateRK4(
    state: OrbitalState,
    properties: PhysicalProperties,
    dt: number,
    forces: ForceModel[]
): OrbitalState {
    const r = state.position;
    const v = state.velocity;
    const t = state.epoch;

    // k1 derivatives
    const k1 = getDerivatives(r, v, properties, t, forces);

    // k2 state and derivatives
    const r2 = add(r, scale(k1.velocity, dt / 2));
    const v2 = add(v, scale(k1.acceleration, dt / 2));
    const k2 = getDerivatives(r2, v2, properties, t + dt / 2, forces);

    // k3 state and derivatives
    const r3 = add(r, scale(k2.velocity, dt / 2));
    const v3 = add(v, scale(k2.acceleration, dt / 2));
    const k3 = getDerivatives(r3, v3, properties, t + dt / 2, forces);

    // k4 state and derivatives
    const r4 = add(r, scale(k3.velocity, dt));
    const v4 = add(v, scale(k3.acceleration, dt));
    const k4 = getDerivatives(r4, v4, properties, t + dt, forces);

    // Weighted average of derivatives: dy/dx = (1/6) * (k1 + 2*k2 + 2*k3 + k4)
    const finalVel = scale(
        add(
            add(k1.velocity, scale(k2.velocity, 2)),
            add(scale(k3.velocity, 2), k4.velocity)
        ),
        1 / 6
    );

    const finalAcc = scale(
        add(
            add(k1.acceleration, scale(k2.acceleration, 2)),
            add(scale(k3.acceleration, 2), k4.acceleration)
        ),
        1 / 6
    );

    // Update position and velocity
    const nextPosition = add(r, scale(finalVel, dt));
    const nextVelocity = add(v, scale(finalAcc, dt));

    return {
        position: nextPosition,
        velocity: nextVelocity,
        epoch: t + dt
    };
}