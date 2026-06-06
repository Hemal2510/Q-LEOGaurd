// src/simulation/SimulationState.ts

import type { Satellite } from '../models/satellite';

/**
 * Lightweight snapshot of force model state for UI consumption.
 * Decoupled from the ForceModel interface so React never
 * imports physics internals directly.
 */
export interface ForceModelState {
    /** Display name of the force model */
    name: string;
    /** Whether this force is currently active in the propagator */
    enabled: boolean;
}

/**
 * Immutable snapshot of simulation state at a given instant.
 * Produced by SimulationEngine.getState() and consumed by
 * React components via the subscribe() observer pattern.
 *
 * All high-frequency satellite position updates bypass this
 * snapshot — Three.js reads directly from SimulationEngine.getSatellites()
 * to avoid triggering React re-renders every frame.
 */
export interface SimulationState {
    /** Current satellite catalog with live orbital states */
    satellites: Satellite[];

    /** Simulation epoch in seconds from t=0 */
    epoch: number;

    /** Whether the simulation loop is currently paused */
    isPaused: boolean;

    /**
     * Simulation time scale multiplier.
     * 60 = 1 real second equals 60 simulation seconds.
     */
    timeScale: number;

    /** Snapshot of registered force models and their enabled states */
    forces: ForceModelState[];
}