// src/simulation/SimulationEngine.ts

import type { Satellite } from '../models/satellite';
import type { ForceModel } from '../core/physics/forces/ForceModel';
import { GravityForce } from '../core/physics/forces/GravityForce';
import {SunGravityForce} from '../core/physics/forces/ThirdBodyForces';
import {MoonGravityForce} from '../core/physics/forces/ThirdBodyForces';
import {AtmosphericDragForce} from "../core/physics/forces/AtmosphericDragForce.ts";
import { propagateRK4 } from '../core/physics/propagator';
import { DEFAULT_SATELLITES, SIM_DEFAULT_CONFIG } from '../config/simConfig';
import { TimeController } from './TimeController';
import type { SimulationState } from './SimulationState';
import { ConjunctionDetector } from './ConjunctionDetector';
import type { ConjunctionEvent } from '../models/conjunction';
import { SolarRadiationPressure } from '../core/physics/forces/SolarRadiationPressure';
import { J2Force } from '../core/physics/forces/J2Force.ts';


export type SimListener = (state: SimulationState) => void;

/**
 * SimulationEngine — singleton coordinator for the orbital simulation.
 * Owns the satellite catalog, force model registry, and animation loop.
 * Delegates all time management to TimeController.
 *
 * High-frequency satellite positions are read directly via getSatellites()
 * by Three.js components — bypassing React state to prevent render storms.
 * Low-frequency UI state (pause, timescale, forces) is broadcast via
 * the observer pattern to React subscribers.
 */
export class SimulationEngine {
    private static instance: SimulationEngine | null = null;

    private satellites: Satellite[]         = [];
    private selectedSatelliteId: string | null = null;
    private initialSatellites: Satellite[] = [];
    private forces: ForceModel[]            = [];
    private listeners: Set<SimListener>     = new Set();
    private animationFrameId: number | null = null;
    private timeController: TimeController  = new TimeController();
    private conjunctionDetector: ConjunctionDetector =
        new ConjunctionDetector();
    private lastConjunctionUpdate = 0;

    private activeConjunctions: ConjunctionEvent[] = [];

    private catalogVersion = 0;

    public getCatalogVersion(): number {
        return this.catalogVersion;
    }

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
     * Stops the loop, reloads default satellites, resets time.
     */
    public reset(): void {
        this.stopLoop();

        if (this.initialSatellites.length > 0) {
            this.satellites = JSON.parse(
                JSON.stringify(this.initialSatellites)
            );
        } else {
            this.satellites = JSON.parse(
                JSON.stringify(DEFAULT_SATELLITES)
            );
        }

        this.forces = [
            new GravityForce(),
            new SunGravityForce(),
            new MoonGravityForce(),
            new SolarRadiationPressure(),
            new J2Force(),
            new AtmosphericDragForce(),

        ];

        this.timeController.reset();

        this.activeConjunctions = [];

        this.notify();

        this.startLoop();
    }

    // ─── Observer ──────────────────────────────────────────────────────────────

    /**
     * Subscribes to low-frequency simulation state changes.
     * Fires immediately with current state on subscription.
     * Returns unsubscribe function for React useEffect cleanup.
     *
     * @param listener Callback receiving SimulationState snapshots
     */
    public subscribe(listener: SimListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Broadcasts current state to all React subscribers.
     * Only called on low-frequency events — never per frame.
     */
    private notify(): void {
        const state = this.getState();
        this.listeners.forEach((l) => l(state));
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    /**
     * Returns full simulation state snapshot for React UI consumption.
     */
    public getState(): SimulationState {
        return {
            satellites: this.satellites,
            epoch:      this.timeController.getEpoch(),
            simulationTimestamp:
                this.timeController.getSimulationTimestamp(),
            isPaused:   this.timeController.isPaused(),
            timeScale:  this.timeController.getTimeScale(),

            selectedSatelliteId: this.selectedSatelliteId,

            forces:     this.forces.map((f) => ({
                name:    f.name,
                enabled: f.enabled,
            })),
            activeConjunctions: this.activeConjunctions
        };
    }

    /**
     * Direct satellite position getter for Three.js render loop.
     * Bypasses React state entirely — no re-renders triggered.
     */
    public getSatellites(): Satellite[] {
        return this.satellites;
    }

    /**
     * Current simulation epoch in seconds from t=0.
     * Read by Earth.tsx every frame for rotation calculation.
     */
    public getEpoch(): number {
        return this.timeController.getEpoch();
    }

    public getSimulationTimestamp(): number {
        return this.timeController.getSimulationTimestamp();
    }

    public selectSatellite(id: string): void {
        this.selectedSatelliteId = id;
        this.notify();
    }

    public clearSelection(): void {
        this.selectedSatelliteId = null;
        this.notify();
    }

    public getSelectedSatelliteId(): string | null {
        return this.selectedSatelliteId;
    }

    /**
     * Returns active force model instances.
     * Used by OrbitPaths and research panels.
     */
    public getForceModels(): ForceModel[] {
        return this.forces;
    }

    /**
     * Replaces the satellite catalog with live TLE data.
     * Called once on app startup after TLE fetch completes.
     *
     * @param satellites Array of satellites from loadTLESatellites()
     */
    public loadSatellites(satellites: Satellite[]): void {

        console.log(
            "Total satellites loaded:",
            satellites.length
        );

        console.log(
            "Unique IDs:",
            new Set(
                satellites.map(s => s.id)
            ).size
        );

        this.initialSatellites = JSON.parse(
            JSON.stringify(satellites)
        );

        this.satellites = JSON.parse(
            JSON.stringify(satellites)
        );

        this.catalogVersion++;


        this.notify();
    }

    // ─── Controls ──────────────────────────────────────────────────────────────

    /**
     * Toggles play/pause. Starts or stops the animation loop.
     * Guards against StrictMode double-mount by checking state first.
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
     * Clamped to [0.1, 100000] inside TimeController.
     *
     * @param scale Multiplier — 60 means 1 real second = 60 sim seconds
     */
    public setTimeScale(scale: number): void {
        this.timeController.setTimeScale(scale);
        this.notify();
    }

    /**
     * Toggles a force model on or off by name.
     * Allows runtime physics experimentation without restart.
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
     * Advances all satellites by one RK4 time step.
     * Called by the animation loop with sub-step sizes from TimeController.
     * Epoch advancement is handled separately via timeController.advanceEpoch()
     * to keep time management fully owned by TimeController.
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

        const now = performance.now();

        if (now - this.lastConjunctionUpdate > 5000) {

            this.activeConjunctions =
                this.conjunctionDetector.detect(
                    this.satellites,
                    this.timeController.getSimulationTimestamp()
                );

            this.lastConjunctionUpdate = now;

            this.notify();
        }

        console.log(
            "Conjunctions:",
            this.activeConjunctions.length
        );

    }

    // ─── Animation Loop ────────────────────────────────────────────────────────

    /**
     * Starts the requestAnimationFrame loop.
     * Guard prevents duplicate loops if called while already running.
     *
     * Each frame:
     *  1. TimeController computes RK4-stable sub-steps for this frame
     *  2. Each sub-step propagates all satellites via RK4
     *  3. Each sub-step advances the epoch in TimeController
     *  4. Loop schedules next frame
     */
    private startLoop(): void {
        if (this.animationFrameId !== null) return;

        const run = (now: number) => {
            if (this.timeController.isPaused()) {
                this.stopLoop();
                return;
            }

            // Get RK4-stable sub-steps for this frame from TimeController
            const steps = this.timeController.computeSteps(now);

            for (const step of steps) {
                this.tick(step);

                this.timeController.advanceTime(step);
            }

            this.animationFrameId = requestAnimationFrame(run);
        };

        this.timeController.syncFrameTime(performance.now());
        this.animationFrameId = requestAnimationFrame(run);
    }

    /**
     * Cancels the active animation frame and clears the reference.
     */
    private stopLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
