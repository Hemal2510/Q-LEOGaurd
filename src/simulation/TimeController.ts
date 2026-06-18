// src/simulation/TimeController.ts

import { SIM_DEFAULT_CONFIG } from '../config/simConfig';

/**
 * Represents a computed time step ready for simulation consumption.
 */
export interface TimeStep {
    /** Scaled simulation delta time in seconds */
    simDt: number;
    /** Raw real-world delta time in seconds */
    realDt: number;
}

/**
 * TimeController manages all time-related state for the simulation.
 * Responsibilities:
 *  - Tracking real-world elapsed time between frames
 *  - Converting real delta time to scaled simulation delta time
 *  - Sub-stepping large time deltas to maintain RK4 numerical stability
 *  - Managing play/pause state and time scale multiplier
 *
 * Intentionally decoupled from SimulationEngine so time logic
 * can be tested, adjusted, and extended independently.
 */
export class TimeController {
    /** Current simulation epoch in seconds from t=0 */
    private epoch: number = 0;

    private simulationTimestamp: number = Date.now();

    /** Real-world timestamp of the last animation frame in milliseconds */
    private lastFrameTime: number = 0;

    /** Simulation time scale multiplier.
     *  1.0 = real time, 60.0 = 1 real second equals 60 simulation seconds */
    private timeScale: number = SIM_DEFAULT_CONFIG.defaultTimeScale;

    /** Whether the simulation is currently paused */
    private paused: boolean = SIM_DEFAULT_CONFIG.startPaused;

    /**
     * Maximum RK4 sub-step size in seconds.
     * Steps larger than this are split to prevent integrator instability.
     * At LEO orbital velocities (~7800 m/s), 60s steps keep position
     * error below ~1m per step.
     */
    private readonly maxStep: number = SIM_DEFAULT_CONFIG.maxTimeStep;

    /**
     * Minimum meaningful simulation step in seconds.
     * Steps smaller than this are discarded to prevent floating point
     * accumulation errors at near-zero dt.
     */
    private readonly minStep: number = SIM_DEFAULT_CONFIG.minTimeStep;

    // ─── Public API ────────────────────────────────────────────────────────────

    /**
     * Called once per animation frame by SimulationEngine.
     * Computes real delta time from last frame, applies time scale,
     * and returns an array of sub-steps for the propagator to consume.
     *
     * @param nowMs Current timestamp from performance.now() in milliseconds
     * @returns Array of sub-steps in simulation seconds. Empty if paused or dt too small.
     */
    public computeSteps(nowMs: number): number[] {
        if (this.paused) return [];


        const realDt = Math.min((nowMs - this.lastFrameTime) / 1000, 1.0);
        this.lastFrameTime = nowMs;

        // Discard near-zero steps — prevents float accumulation on first frame
        if (realDt < 0.0001) return [];

        const simDt = realDt * this.timeScale;
        return this.subdivide(simDt);
    }


    /**
     * Advances the internal epoch by a completed simulation step.
     * Called by SimulationEngine after each successful propagation step.
     *
     * @param dt Simulation delta time in seconds
     */
    public advanceTime(dt: number): void {
        this.epoch += dt;
        this.simulationTimestamp += dt * 1000;
    }

    /**
     * Marks the current frame time as the reference point for the next delta.
     * Must be called when unpausing to prevent a large dt spike on resume.
     *
     * @param nowMs Current timestamp from performance.now() in milliseconds
     */
    public syncFrameTime(nowMs: number): void {
        this.lastFrameTime = nowMs;
    }

    /**
     * Toggles play/pause state.
     * Syncs frame time on unpause to prevent dt spike.
     */
    public togglePause(): void {
        this.paused = !this.paused;
        if (!this.paused) {
            this.syncFrameTime(performance.now());
        }
    }

    /**
     * Sets the simulation time scale multiplier.
     * Clamped to [0.1, 100000] to prevent degenerate values.
     *
     * @param scale Multiplier — e.g. 60 means 1 real second = 60 sim seconds
     */
    public setTimeScale(scale: number): void {
        this.timeScale = Math.max(0.1, Math.min(scale, 100_000));
    }

    /**
     * Resets all time state to initial configuration.
     * Called by SimulationEngine.reset().
     */
    public reset(): void {
        this.epoch = 0;
        this.simulationTimestamp = Date.now();

        this.lastFrameTime = 0;
        this.paused = SIM_DEFAULT_CONFIG.startPaused;
        this.timeScale = SIM_DEFAULT_CONFIG.defaultTimeScale;
    }

    // ─── Getters ───────────────────────────────────────────────────────────────

    /** Current simulation epoch in seconds from t=0 */
    public getEpoch(): number {
        return this.epoch;
    }

    /** Whether the simulation is currently paused */
    public isPaused(): boolean {
        return this.paused;
    }

    /** Current time scale multiplier */
    public getTimeScale(): number {
        return this.timeScale;
    }

    public getSimulationTimestamp(): number {
        return this.simulationTimestamp;
    }

    // ─── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Splits a simulation delta time into RK4-stable sub-steps.
     * Any step exceeding maxStep is subdivided. Steps below minStep are discarded.
     *
     * @param simDt Total simulation delta time in seconds
     * @returns Array of sub-step sizes in seconds
     */
    private subdivide(simDt: number): number[] {
        const steps: number[] = [];
        let remaining = simDt;

        while (remaining > this.minStep) {
            const step = Math.min(remaining, this.maxStep);
            steps.push(step);
            remaining -= step;
        }

        return steps;
    }
}