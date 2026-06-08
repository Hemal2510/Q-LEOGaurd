import type { Vector3D } from '../core/math/vector';
import type { ForceModel } from '../core/physics/forces/forceModel';
/**
 * Classical Keplerian orbital elements.
 * Extremely useful for analytical descriptions of orbits.
 */
export interface KeplerianElements {
    semiMajorAxis: number;        // a (meters)
    eccentricity: number;         // e (dimensionless)
    inclination: number;          // i (radians)
    rightAscension: number;       // Ω - Right Ascension of Ascending Node (radians)
    argumentOfPeriapsis: number;  // ω - Argument of Periapsis (radians)
    trueAnomaly: number;          // ν - True anomaly (radians)
}

/**
 * State vector representing dynamic orbital telemetry.
 * Expressed in the Earth-Centered Inertial (ECI) coordinate frame.
 */
export interface OrbitalState {
    position: Vector3D;           // Position vector [x, y, z] in meters
    velocity: Vector3D;           // Velocity vector [vx, vy, vz] in m/s
    epoch: number;                // Simulation time in seconds (from a coordinate epoch)
    elements?: KeplerianElements; // Optional calculated Keplerian elements
}

/**
 * Physical attributes of the space object.
 * Optional properties, allowing the simulator to run with or without details.
 */
export interface PhysicalProperties {
    mass?: number;                // Mass of the satellite in kg
    dragCoefficient?: number;     // Cd, coefficient of atmospheric drag (dimensionless)
    crossSectionArea?: number;    // Area facing relative wind or radiation in m^2
}

export type ObjectCategory = 'satellite' | 'debris' | 'rocket-body';


/**
 * Core data structure for a satellite or space object.
 */
export interface Satellite {
    id: string;                   // Unique UUID or designator
    name: string;                 // Readable name (e.g., ISS, Sentinel-1)
    noradId?: number;             // Catalog ID if parsed from TLE
    state: OrbitalState;          // Dynamic orbital coordinates
    properties?: PhysicalProperties; // Aerodynamic, mass, and propulsion properties
}