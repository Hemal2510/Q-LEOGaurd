// src/types/satellite.js.d.ts
declare module 'satellite.js' {
    export interface SatRec {
        error: number;
        satnum: string;
    }

    export interface EciVec3<T> {
        x: T;
        y: T;
        z: T;
    }

    export interface PositionAndVelocity {
        position: EciVec3<number> | false;
        velocity: EciVec3<number> | false;
    }

    export function twoline2satrec(tleLine1: string, tleLine2: string): SatRec;
    export function propagate(satrec: SatRec, date: Date): PositionAndVelocity;
    export function gstime(date: Date): number;
    export function eciToEcf(eci: EciVec3<number>, gmst: number): EciVec3<number>;
}