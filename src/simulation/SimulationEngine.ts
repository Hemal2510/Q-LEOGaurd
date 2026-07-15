import type { Satellite } from '../models/satellite';
import type { ForceModel } from '../core/physics/forces/ForceModel';
import { GravityForce } from '../core/physics/forces/GravityForce';
import { AtmosphericDragForce } from '../core/physics/forces/AtmosphericDragForce';
import { propagateRK4 } from '../core/physics/propagator';
import { DEFAULT_SATELLITES, SIM_DEFAULT_CONFIG } from '../config/simConfig';
import { TimeController } from './TimeController';
import type { SimulationState } from './SimulationState';

export type SimListener = (state: SimulationState) => void;

export class SimulationEngine {
    private static instance: SimulationEngine | null = null;

    private satellites: Satellite[]         = [];
    private selectedSatelliteId: string | null = null;
    private initialSatellites: Satellite[] = [];
    private forces: ForceModel[]            = [];
    private listeners: Set<SimListener>     = new Set();
    private animationFrameId: number | null = null;
    private timeController: TimeController  = new TimeController();

    private constructor() {
        this.reset();
    }

    public static getInstance(): SimulationEngine {
        if (!SimulationEngine.instance) {
            SimulationEngine.instance = new SimulationEngine();
        }
        return SimulationEngine.instance;
    }

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
            new AtmosphericDragForce(),
        ];

        this.timeController.reset();

        this.notify();

        this.startLoop();
    }

    public subscribe(listener: SimListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(): void {
        const state = this.getState();
        this.listeners.forEach((l) => l(state));
    }

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
        };
    }

    public getSatellites(): Satellite[] {
        return this.satellites;
    }

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

    public getForceModels(): ForceModel[] {
        return this.forces;
    }

    public loadSatellites(satellites: Satellite[]): void {
        this.initialSatellites = JSON.parse(
            JSON.stringify(satellites)
        );

        this.satellites = JSON.parse(
            JSON.stringify(satellites)
        );

        this.notify();
    }

    public togglePause(): void {
        this.timeController.togglePause();
        if (!this.timeController.isPaused()) {
            this.startLoop();
        } else {
            this.stopLoop();
        }
        this.notify();
    }

    public setTimeScale(scale: number): void {
        this.timeController.setTimeScale(scale);
        this.notify();
    }

    public toggleForce(name: string): void {
        const force = this.forces.find((f) => f.name === name);
        if (force) {
            force.enabled = !force.enabled;
            this.notify();
        }
    }

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

    private startLoop(): void {
        if (this.animationFrameId !== null) return;

        const run = (now: number) => {
            if (this.timeController.isPaused()) {
                this.stopLoop();
                return;
            }

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

    private stopLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
