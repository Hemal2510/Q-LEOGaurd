// src/features/visualization/components/OrbitPaths.tsx

import { useMemo, useState, useEffect } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { propagateRK4 } from '../../../core/physics/propagator';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

const ORBIT_POINTS = 256;
const EARTH_MU = 3.986004418e14; // m³/s²

/**
 * OrbitPaths — renders one full orbital period as a line loop per satellite.
 * Recomputed only when the catalog itself changes (engine.getCatalogVersion()),
 * NOT on satellite selection — selection is a color-only change, handled
 * separately below without touching geometry.
 */
export function OrbitPaths() {
    const engine = SimulationEngine.getInstance();
    const scale = SIM_DEFAULT_CONFIG.distanceScale;

    const [, forceRender] = useState(0);

    useEffect(() => {
        const unsub = engine.subscribe(() => forceRender(v => v + 1));
        return unsub;
    }, []);

    const paths = useMemo(() => {
        return engine.getSatellites().map((sat) => {
            // Vis-viva circular approximation: T = 2π√(a³/μ), a ≈ |r|
            const r = Math.sqrt(
                sat.state.position[0] ** 2 +
                sat.state.position[1] ** 2 +
                sat.state.position[2] ** 2
            );
            const period = 2 * Math.PI * Math.sqrt((r ** 3) / EARTH_MU);
            const dt = period / ORBIT_POINTS;

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

            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new Float32BufferAttribute(points, 3));

            return { id: sat.id, geometry };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine.getCatalogVersion()]);

    // Computed once per render, not once per path — O(n), not O(n²)
    const conjunctionIds = new Set(
        engine.getState().activeConjunctions.flatMap(c => [c.satelliteAId, c.satelliteBId])
    );
    const selectedId = engine.getSelectedSatelliteId();

    return (
        <group>
            {paths.map((path) => {
                const isConjunction = conjunctionIds.has(path.id);
                const isSelected = path.id === selectedId;

                return (
                    <line key={path.id} geometry={path.geometry}>
                        <lineBasicMaterial
                            color={
                                isSelected
                                    ? '#fbbf24'
                                    : isConjunction
                                        ? '#ff3333'
                                        : '#378add'
                            }
                            transparent
                            opacity={
                                isConjunction || isSelected ? 1.0 : 0.15
                            }
                            depthWrite={false}
                        />
                    </line>
                );
            })}
        </group>
    );
}