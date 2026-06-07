import type { Satellite } from '../models/satellite';

/**
 * Default simulation settings.
 */
export const SIM_DEFAULT_CONFIG = {
    // Max step size for RK4 propagation in seconds
    maxTimeStep: 60,
    // Minimum time step size
    minTimeStep: 0.001,
    // Default play/pause state
    startPaused: false,
    // Default timescale (1 second real time = 60 seconds simulation time)
    defaultTimeScale: 60,
    // R3F scaling factor (scales real meters down for visual WebGL units to prevent float jitter)
    // 1 WebGL unit = 1,000,000 meters (1,000 km)
    distanceScale: 1e-6,
};

/**
 * Initial set of satellites representing different orbital regimes.
 * Positions and velocities are in Earth-Centered Inertial (ECI) frame in meters.
 */
export const DEFAULT_SATELLITES: Satellite[] = [
    {
        id: 'iss-leo',
        name: 'ISS (Low Earth Orbit)',
        noradId: 25544,
        state: {
            // Altitude ~420km, Inclination 51.6 degrees
            position: [6798137.0, 0.0, 0.0],
            velocity: [0.0, 4768.0, 6003.0],
            epoch: 0,
        },
        properties: {
            mass: 420000, // kg
            dragCoefficient: 2.2,
            crossSectionArea: 2000, // m^2
        }
    },
    {
        id: 'gps-meo',
        name: 'GPS Navstar (Medium Earth Orbit)',
        noradId: 35752,
        state: {
            // Distance ~26,560km, Inclination 55 degrees
            position: [26560000.0, 0.0, 0.0],
            velocity: [0.0, 2220.0, 3170.0],
            epoch: 0,
        },
        properties: {
            mass: 1630,
            dragCoefficient: 2.0,
            crossSectionArea: 15,
        }
    },
    {
        id: 'geo-sat',
        name: 'Inmarsat-4 (Geostationary Orbit)',
        noradId: 28628,
        state: {
            // Distance ~42,164km, 0 degrees inclination (synchronous)
            position: [42164000.0, 0.0, 0.0],
            velocity: [0.0, 3075.0, 0.0],
            epoch: 0,
        },
        properties: {
            mass: 5960,
            dragCoefficient: 2.0,
            crossSectionArea: 45,
        }
    }
];