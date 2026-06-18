// src/features/visualization/components/OrbitPaths.tsx

import { useMemo, useState, useEffect } from 'react';
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { propagateRK4 } from '../../../core/physics/propagator';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

/**
 * Number of points sampled along each orbit to draw the path.
 * Higher = smoother curve, more geometry. 256 is clean for LEO/MEO/GEO.
 */
const ORBIT_POINTS = 256;

/**
 * OrbitPaths — renders one full orbital period as a line loop
 * for each satellite. Computed once on mount from initial state
 * using RK4 forward propagation.
 *
 * Not updated every frame — orbit paths are recalculated only
 * when satellite catalog changes. This keeps geometry allocation
 * off the hot render path.
 */
export function OrbitPaths() {
    const engine = SimulationEngine.getInstance();
    const scale = SIM_DEFAULT_CONFIG.distanceScale;

    const [satCount, setSatCount] = useState(
        engine.getSatellites().length
    );

    useEffect(() => {
        const unsub = engine.subscribe((state) => {
            setSatCount(state.satellites.length);
        });

        return unsub;
    }, []);

    const paths = useMemo(() => {
        console.log(
            `Generating orbit paths for ${engine.getSatellites().length} satellites`
        );
        return engine.getSatellites().map((sat) => {
            // Estimate orbital period using vis-viva: T = 2π√(a³/μ)
            // For a circular approximation: a ≈ |r|
            const MU = 3.986004418e14; // m³/s²
            const r = Math.sqrt(
                sat.state.position[0] ** 2 +
                sat.state.position[1] ** 2 +
                sat.state.position[2] ** 2
            );
            const period = 2 * Math.PI * Math.sqrt((r ** 3) / MU);
            const dt = period / ORBIT_POINTS;

            // Forward propagate one full period to sample the orbit
            const points: number[] = [];
            let state = { ...sat.state };

            for (let i = 0; i < ORBIT_POINTS; i++) {
                points.push(
                    state.position[0] * scale,
                    state.position[1] * scale,
                    state.position[2] * scale
                );
                state = propagateRK4(
                    state,
                    sat.properties ?? SIM_DEFAULT_CONFIG.defaultProperties,
                    dt,
                    engine.getForceModels()
                );
            }

            // Build BufferGeometry from sampled points
            const geometry = new BufferGeometry();
            geometry.setAttribute(
                'position',
                new Float32BufferAttribute(points, 3)
            );

            return { id: sat.id, geometry };
        });
    }, [satCount]);

    return (
        <group>
            {paths.map((path) => (
                <line key={path.id} geometry={path.geometry}>
                    <lineBasicMaterial
                        color="#378add"
                        transparent
                        opacity={0.15}
                        depthWrite={false}
                    />
                </line>
            ))}
        </group>
    );
}