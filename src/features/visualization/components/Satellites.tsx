// src/features/visualization/components/Satellites.tsx

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

/**
 * Satellite marker radius in WebGL units.
 * Small enough to read as a point, large enough to see at orbital distances.
 */
const MARKER_RADIUS = 0.30;

/**
 * Satellites — renders live position markers for all tracked satellites.
 * Reads directly from SimulationEngine.getSatellites() every frame,
 * bypassing React state to prevent re-render storms at 60fps.
 *
 * Each satellite renders as a small emissive sphere.
 * Color encodes orbital regime:
 *   Blue  → LEO  (altitude < 2,000km)
 *   Green → MEO  (altitude 2,000–35,786km)
 *   Gold  → GEO  (altitude ~35,786km)
 */
export function Satellites() {
    const groupRef = useRef<Group>(null);
    const engine = SimulationEngine.getInstance();
    const scale = SIM_DEFAULT_CONFIG.distanceScale;

    useFrame(() => {
        if (!groupRef.current) return;

        const satellites = engine.getSatellites();

        satellites.forEach((sat, i) => {
            const child = groupRef.current!.children[i];
            if (!child) return;

            // Scale ECI position from meters to WebGL units
            child.position.set(
                sat.state.position[0] * scale,
                sat.state.position[1] * scale,
                sat.state.position[2] * scale
            );
        });
    });

    const satellites = engine.getSatellites();

    return (
        <group ref={groupRef}>
            {satellites.map((sat) => {
                    // Determine color by orbital altitude
                    const altitudeM =
                        Math.sqrt(
                            sat.state.position[0] ** 2 +
                            sat.state.position[1] ** 2 +
                            sat.state.position[2] ** 2
                        ) - 6_371_000;

                    const color =
                        altitudeM < 2_000_000
                            ? '#7dd3fc'   // LEO — blue
                            : altitudeM < 35_000_000
                                ? '#86efac'   // MEO — green
                                : '#fcd34d';  // GEO — gold

                    return (
                        <mesh key={sat.id}>
                        <sphereGeometry args={[MARKER_RADIUS, 8, 8]} />
                    <meshBasicMaterial color={color} />
                    </mesh>
                );
                })}
            </group>
    );
}