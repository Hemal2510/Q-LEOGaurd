// src/features/visualization/components/SelectionIndicator.tsx

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

export function SelectionIndicator() {
    const engine = SimulationEngine.getInstance();

    const meshRef = useRef<Mesh>(null);

    useFrame(({ clock }) => {

        const selectedId = engine.getSelectedSatelliteId();

        if (!selectedId || !meshRef.current) {
            if (meshRef.current) {
                meshRef.current.visible = false;
            }
            return;
        }

        const satellite = engine
            .getSatellites()
            .find((sat) => sat.id === selectedId);

        if (!satellite) return;

        const scale = SIM_DEFAULT_CONFIG.distanceScale;

        meshRef.current.visible = true;

        meshRef.current.position.set(
            satellite.state.position[0] * scale,
            satellite.state.position[1] * scale,
            satellite.state.position[2] * scale
        );

        const pulse =
            1.5 + Math.sin(clock.elapsedTime * 4) * 0.4;

        meshRef.current.scale.set(
            pulse,
            pulse,
            pulse
        );
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#ff4444" />
        </mesh>
    );
}