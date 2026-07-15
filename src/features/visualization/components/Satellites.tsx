// src/features/visualization/components/Satellites.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

/** Satellite marker radius in WebGL units. Units: WebGL units */
const MARKER_RADIUS = 0.15;

/**
 * Risk score (0-100) above which a conjunction marker actively pulses.
 * Below this, risk is still color-coded but held static — pulsing
 * everything under threshold would make low-risk pairs look as urgent
 * as high-risk ones. This threshold is a judgment call, not derived —
 * revisit if it doesn't read well visually.
 */
const RISK_PULSE_THRESHOLD = 50;

/**
 * Determines marker color from orbital altitude.
 * Blue → LEO <2,000km | Green → MEO 2,000–35,786km | Gold → GEO
 * @param position ECI position vector in meters
 */
function orbitColor(position: [number, number, number]): string {
    const altM =
        Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2)
        - 6_371_000;

    if (altM < 2_000_000)  return '#7dd3fc';
    if (altM < 35_000_000) return '#86efac';
    return '#fcd34d';
}

/**
 * Maps a 0-100 risk score to an RGB color for a conjunction marker.
 * Risk 0 → muted orange, risk 100 → saturated red.
 * pulseFactor in [0,1] dims the non-red channels for a pulsing alert
 * effect on high-risk pairs only.
 */
function riskToColor(risk: number, pulseFactor: number = 1): [number, number, number] {
    const t = Math.min(Math.max(risk / 100, 0), 1);
    const channelBase = (1 - t) * 0.6; // 0.6 at risk=0, 0 at risk=100
    const channel = risk > RISK_PULSE_THRESHOLD
        ? channelBase * pulseFactor
        : channelBase;
    return [1, channel, channel];
}

/**
 * Builds a satelliteId -> highest active riskScore map from current
 * conjunction events. A satellite involved in multiple simultaneous
 * conjunctions is colored by its worst one.
 */
function getConjunctionRiskMap(engine: SimulationEngine): Map<string, number> {
    const map = new Map<string, number>();
    for (const c of engine.getState().activeConjunctions) {
        map.set(c.satelliteAId, Math.max(map.get(c.satelliteAId) ?? 0, c.riskScore));
        map.set(c.satelliteBId, Math.max(map.get(c.satelliteBId) ?? 0, c.riskScore));
    }
    return map;
}

/**
 * Satellites — renders live position markers for all tracked satellites.
 * Position updates and conjunction coloring run every frame via useFrame,
 * bypassing React state. React re-render only happens on catalog/selection
 * change (via engine subscription), to rebuild mesh children.
 */
export function Satellites() {
    const groupRef = useRef<Group>(null);
    const engine   = SimulationEngine.getInstance();
    const scale    = SIM_DEFAULT_CONFIG.distanceScale;

    const [, forceRender] = useState(0);

    useEffect(() => {
        const unsub = engine.subscribe(() => forceRender(v => v + 1));
        return unsub;
    }, []);

    useFrame(() => {
        if (!groupRef.current) return;
        const satellites = engine.getSatellites();
        const children   = groupRef.current.children;

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
        const riskMap = getConjunctionRiskMap(engine);

        for (let i = 0; i < children.length; i++) {
            const mesh = children[i] as Mesh;
            const material = mesh.material as any;
            const satelliteId = mesh.userData.satelliteId;

            // Selection takes visual priority over conjunction alert —
            // an explicit user click should always be clearly visible.
            if (satelliteId === selectedId) {
                const pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.005);
                material.color.setRGB(pulse, 0, pulse);
                continue;
            }

            const risk = riskMap.get(satelliteId);
            if (risk !== undefined) {
                const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
                const [r, g, b] = riskToColor(risk, pulse);
                material.color.setRGB(r, g, b);
                continue;
            }

            material.color.set(
                orbitColor(satellites[i].state.position as [number, number, number])
            );
        }
    });

    const satellites = engine.getSatellites();
    const selectedId = engine.getSelectedSatelliteId();
    const riskMap = getConjunctionRiskMap(engine);

    return (
        <group ref={groupRef}>
            {satellites.map((sat) => {
                const isSelected = sat.id === selectedId;
                const risk = riskMap.get(sat.id);

                const [r, g, b] = risk !== undefined
                    ? riskToColor(risk)
                    : [0, 0, 0];

                return (
                    <mesh
                        key={sat.id}
                        userData={{ satelliteId: sat.id }}
                        onClick={(e) => {
                            e.stopPropagation();
                            engine.selectSatellite(sat.id);
                        }}
                    >
                        <sphereGeometry args={[MARKER_RADIUS, 8, 8]} />
                        <meshBasicMaterial
                            color={
                                isSelected
                                    ? '#fbbf24'
                                    : risk !== undefined
                                        ? `rgb(${r * 255}, ${g * 255}, ${b * 255})`
                                        : orbitColor(sat.state.position as [number, number, number])
                            }
                        />
                    </mesh>
                );
            })}
        </group>
    );
}