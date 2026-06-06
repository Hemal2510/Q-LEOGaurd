// src/simulation/SimulationEngine.ts

import type { Satellite } from '../models/satellite';
import type { ForceModel } from '../core/physics/forces/forceModel';
import { GravityForce } from '../core/physics/forces/gravityForce';
import { propagateRK4 } from '../core/physics/propagator';
import { DEFAULT_SATELLITES, SIM_DEFAULT_CONFIG } from '../config/simConfig';
import { TimeController } from './TimeController';
import type { SimulationState } from './SimulationState';

export type SimListener = (state: SimulationState) => void;

/**
 * SimulationEngine coordinates the propagation loop, satellite catalog,
 * and force models. Time management is fully delegated to TimeController.
 * Structured as a singleton to prevent multiple conflicting animation loops.
 */
export class SimulationEngine {
    private static instance: SimulationEngine | null = null;

    private satellites: Satellite[] = [];
    private forces: ForceModel[] = [];
    private listeners: Set<SimListener> = new Set();
    private animationFrameId: number | null = null;
    private timeController: TimeController = new TimeController();

    private constructor() {
        this.reset();
    }

    public static getInstance(): SimulationEngine {
        if (!SimulationEngine.instance) {
            SimulationEngine.instance = new SimulationEngine();
        }
        return SimulationEngine.instance;
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Resets simulation to initial configuration.
     * Clears epoch, reloads default satellites, re-registers force models.
     */
    public reset(): void {
        this.satellites = JSON.parse(JSON.stringify(DEFAULT_SATELLITES));
        this.forces = [new GravityForce()];
        this.timeController.reset();
        this.notify();
    }

    // ─── Observer Pattern ──────────────────────────────────────────────────────

    /**
     * Registers a state-change listener for low-frequency UI updates.
     * Immediately fires with current state on subscription.
     * Returns an unsubscribe function for clean React useEffect teardown.
     *
     * @param listener Callback receiving SimulationState snapshots
     * @returns Unsubscribe function
     */
    public subscribe(listener: SimListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Broadcasts current state to all registered listeners.
     * Only called on low-frequency events — play/pause, timescale, force toggle.
     * Never called per-frame to avoid React re-render storms.
     */
    private notify(): void {
        const state = this.getState();
        this.listeners.forEach((listener) => listener(state));
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    /**
     * Builds and returns a full immutable simulation state snapshot.
     * Consumed by React components via subscribe().
     */
    public getState(): SimulationState {
        return {
            satellites: this.satellites,
            epoch: this.timeController.getEpoch(),
            isPaused: this.timeController.isPaused(),
            timeScale: this.timeController.getTimeScale(),
            forces: this.forces.map((f) => ({ name: f.name, enabled: f.enabled })),
        };
    }

    /**
     * High-frequency position getter for Three.js render loop.
     * Bypasses React state entirely to prevent per-frame re-renders.
     */
    public getSatellites(): Satellite[] {
        return this.satellites;
    }

    /**
     * Returns current simulation epoch in seconds from t=0.
     * Used by Three.js components that need epoch without full state snapshot.
     */
    public getEpoch(): number {
        return this.timeController.getEpoch();
    }

    /**
     * Returns registered force model instances.
     * Used by research/debug panels to inspect active physics.
     */
    public getForceModels(): ForceModel[] {
        return this.forces;
    }

    // ─── Controls ──────────────────────────────────────────────────────────────

    /**
     * Toggles play/pause state. Delegates time state to TimeController.
     * Starts or stops the animation loop accordingly.
     */
    public togglePause(): void {
        this.timeController.togglePause();
        if (!this.timeController.isPaused()) {
            this.startLoop();
        } else {
            this.stopLoop();
        }
        this.notify();
    }

    /**
     * Updates simulation time scale multiplier.
     * Delegated to TimeController which clamps to safe range [0.1, 100000].
     *
     * @param scale Multiplier — 60 means 1 real second = 60 simulation seconds
     */
    public setTimeScale(scale: number): void {
        this.timeController.setTimeScale(scale);
        this.notify();
    }

    /**
     * Toggles a registered force model on or off by name.
     * Allows runtime physics experimentation without restarting simulation.
     *
     * @param name Force model name as defined by ForceModel.name
     */
    public toggleForce(name: string): void {
        const force = this.forces.find((f) => f.name === name);
        if (force) {
            force.enabled = !force.enabled;
            this.notify();
        }
    }

    // ─── Propagation ───────────────────────────────────────────────────────────

    /**
     * Advances all satellites by one simulation time step using RK4.
     * Called repeatedly by the animation loop with sub-step sizes from TimeController.
     *
     * @param dt Simulation delta time in seconds — must be positive
     */
    public tick(dt: number): void {
        if (dt <= 0) return;

        for (const sat of this.satellites) {
            sat.state = propagateRK4(
                sat.state,
                sat.properties ?? SIM_DEFAULT_CONFIG.defaultProperties,
                dt,
                this.forces
            );
        }
    }

    // ─── Animation Loop ────────────────────────────────────────────────────────

    /**
     * Starts the requestAnimationFrame loop.
     * TimeController handles real-to-sim time conversion and sub-stepping.
     * Guard prevents duplicate loops if called while already running.
     */
    private startLoop(): void {
        if (this.animationFrameId !== null) return;

        const run = (now: number) => {
            if (this.timeController.isPaused()) {
                this.stopLoop();
                return;
            }

            // TimeController returns RK4-stable sub-steps for this frame
            const steps = this.timeController.computeSteps(now);
            for (const step of steps) {
                this.tick(step);
            }

            this.animationFrameId = requestAnimationFrame(run);
        };

        this.timeController.syncFrameTime(performance.now());
        this.animationFrameId = requestAnimationFrame(run);
    }

    /**
     * Cancels the active animation frame and clears the loop reference.
     */
    private stopLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}