// src/features/visualization/components/Satellites.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group,Mesh } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

/**
 * Satellite marker radius in WebGL units.
 * Slightly exaggerated from true size — necessary for visibility
 * at orbital distances without losing the point-like appearance.
 * Units: WebGL units
 */
const MARKER_RADIUS = 0.15;

/**
 * Determines marker color from orbital altitude.
 * Color encodes regime at a glance:
 *   Blue  → LEO  altitude < 2,000km
 *   Green → MEO  altitude 2,000–35,786km
 *   Gold  → GEO  altitude ~35,786km
 *
 * @param position ECI position vector in meters
 * @returns Hex color string
 */
function orbitColor(position: [number, number, number]): string {
    const altM =
        Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2)
        - 6_371_000;

    if (altM < 2_000_000)  return '#7dd3fc'; // LEO — blue
    if (altM < 35_000_000) return '#86efac'; // MEO — green
    return '#fcd34d';                         // GEO — gold
}

/**
 * Satellites — renders live position markers for all tracked satellites.
 *
 * Architecture:
 *  - `satCount` state triggers a React re-render when TLE catalog loads,
 *    rebuilding the mesh children to match the new satellite count.
 *  - `useFrame` then updates each child's position every frame by reading
 *    directly from SimulationEngine — bypassing React state entirely.
 *  - This gives us dynamic catalog updates without per-frame re-renders.
 */
export function Satellites() {
    const groupRef = useRef<Group>(null);
    const engine   = SimulationEngine.getInstance();
    const scale    = SIM_DEFAULT_CONFIG.distanceScale;

    /**
     * satCount triggers re-render when catalog size changes.
     * Subscribing to SimulationEngine ensures we catch TLE load events.
     */
    const [, forceRender] = useState(0);

    useEffect(() => {
        const unsub = engine.subscribe((state) => {
            forceRender(v => v + 1);
        });
        return unsub;
    }, []);

    /**
     * High-frequency position update — runs every frame.
     * Updates mesh positions directly without React state.
     * Guard on child count prevents index mismatch during catalog swap.
     */
    useFrame(() => {
        if (!groupRef.current) return;
        const satellites = engine.getSatellites();
        const children   = groupRef.current.children;

        // Guard — child count must match satellite count
        // Mismatch means catalog just updated, re-render is incoming
        if (children.length !== satellites.length) return;

        for (let i = 0; i < satellites.length; i++) {
            const pos = satellites[i].state.position;
            children[i].position.set(
                pos[0] * scale,
                pos[1] * scale,
                pos[2] * scale,
            );
        }

        const selectedId = engine.getSelectedSatelliteId();

        const conjunctionIds = new Set(
            engine
                .getState()
                .activeConjunctions
                .flatMap(c => [
                    c.satelliteAId,
                    c.satelliteBId
                ])
        );

        for (let i = 0; i < children.length; i++) {

            const mesh = children[i] as Mesh;

            const material = mesh.material as any;

            const satelliteId =
                mesh.userData.satelliteId;

            if (
                satelliteId === 'tle-25544' ||
                satelliteId === 'tle-36086' ||
                satelliteId === 'tle-49044' ||
                satelliteId === 'tle-66664' ||
                satelliteId === 'tle-48274' ||
                satelliteId === 'tle-53239' ||
                satelliteId === 'tle-54216'
            ) {
                console.log(
                    "MESH CHECK:",
                    satelliteId,
                    mesh.uuid
                );
            }

            const isConjunction =
                conjunctionIds.has(satelliteId);

            if (isConjunction) {
                console.log(
                    satelliteId,
                    mesh.position.x,
                    mesh.position.y,
                    mesh.position.z
                );



                const pulse =
                    0.5 + 0.5 * Math.sin(
                        performance.now() * 0.005
                    );

                material.color.setRGB(
                    1,
                    pulse * 0.25,
                    pulse * 0.25
                );
            }            else if (satelliteId === selectedId) {

                const pulse =
                    0.7 + 0.3 * Math.sin(
                        performance.now() * 0.005
                    );

                material.color.setRGB(
                    pulse,
                    0,
                    pulse
                );
            }
            else {

                material.color.set(
                    orbitColor(
                        satellites[i].state.position as [
                            number,
                            number,
                            number
                        ]
                    )
                );
            }
        }
    });

    const satellites = engine.getSatellites();
    const selectedId = engine.getSelectedSatelliteId();

    const ids = satellites.map(s => s.id);

    console.log(
        "Satellite Count:",
        ids.length
    );

    console.log(
        "Unique IDs:",
        new Set(ids).size
    );

    const duplicates = ids.filter(
        (id, index) => ids.indexOf(id) !== index
    );

    console.log(
        "Duplicate IDs:",
        [...new Set(duplicates)]
    );

    console.log("SATELLITES COMPONENT RENDERED");
    console.log("Selected ID:", selectedId);


    return (
        <group ref={groupRef}>
            {satellites.map((sat) => {
                const isSelected = sat.id === selectedId;

                const isConjunction =
                    engine
                        .getState()
                        .activeConjunctions
                        .some(
                            c =>
                                c.satelliteAId === sat.id ||
                                c.satelliteBId === sat.id
                        );

                if (isConjunction) {
                    console.log(
                        "RED SAT:",
                        sat.id,
                        sat.name
                    );
                }

                if (isSelected) {
                    console.log("SELECTED SAT:", sat.name);
                }



                return (
                    <mesh
                        key={sat.id}
                        userData={{ satelliteId: sat.id }}
                        onClick={(e) => {
                            e.stopPropagation();
                            engine.selectSatellite(sat.id);
                        }}
                    >
                        <sphereGeometry
                            args={[
                                MARKER_RADIUS,
                                8,
                                8,
                            ]}
                        />
                        <meshBasicMaterial
                            color={
                                isSelected
                                    ? '#fbbf24'
                                    : isConjunction
                                        ? '#ff3333'
                                        : orbitColor(
                                            sat.state.position as [
                                                number,
                                                number,
                                                number
                                            ]
                                        )
                            }
                        />
                    </mesh>
                );
            })}
        </group>
    );
}