// src/features/visualization/scene/OrbitalCanvas.tsx

import { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { Earth } from '../components/Earth';
import { Satellites } from '../components/Satellites';
import { OrbitPaths } from '../components/OrbitPaths';

/**
 * SceneLoop — invisible component that ticks the simulation engine
 * in sync with R3F's render loop every frame.
 * Forces R3F to treat the scene as continuously dirty so satellite
 * positions update visually without React state re-renders.
 */
function SceneLoop() {
    const engine = SimulationEngine.getInstance();

    useFrame(() => {
        // Read satellites every frame — signals R3F the scene is dirty
        // Actual propagation runs inside SimulationEngine's own rAF loop
        engine.getSatellites();
    });

    return null;
}

/**
 * OrbitalCanvas — root Three.js scene for Q-LEOGuard.
 * Owns the R3F Canvas, camera configuration, lighting rig,
 * and all visualization components.
 *
 * Architecture:
 *  Canvas (R3F)
 *  ├── SceneLoop        — keeps scene rendering every frame
 *  ├── Stars            — background starfield (drei)
 *  ├── Earth            — sphere with atmosphere layers
 *  ├── Satellites       — live satellite position markers
 *  ├── OrbitPaths       — precomputed orbital trail lines
 *  ├── OrbitControls    — mouse drag / zoom / pan (drei)
 *  └── Lights           — ambient + directional sun rig
 */
export function OrbitalCanvas() {
    const engine = SimulationEngine.getInstance();

    useEffect(() => {
        // Start simulation loop on mount
        engine.togglePause();
        return () => {
            // Stop loop on unmount — prevents ghost rAF after component unmounts
            if (!engine.getState().isPaused) {
                engine.togglePause();
            }
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', background: '#060d1a' }}>
            <Canvas
                camera={{
                    position: [0, 15, 35],
                    fov: 50,
                    near: 0.1,
                    far: 5000,
                }}

                gl={{
                    antialias: true,
                    alpha: false,
                }}
                dpr={Math.min(window.devicePixelRatio, 2)}
            >
                {/* Simulation driver */}
                <SceneLoop />

                {/* Background starfield */}
                <Stars
                    radius={300}
                    depth={60}
                    count={4000}
                    factor={3}
                    fade
                    speed={0}
                />

                {/* Lighting rig */}
                <ambientLight intensity={0.18} color="#223344" />
                <directionalLight
                    position={[5, 3, 5]}
                    intensity={2.2}
                    color="#ffeedd"
                />
                <directionalLight
                    position={[-4, -2, -3]}
                    intensity={0.4}
                    color="#1a4a8a"
                />

                {/* Scene */}
                <Earth />
                <Satellites />
                <OrbitPaths />

                {/* Mouse controls */}
                <OrbitControls
                    enablePan={true}
                    panSpeed={0.5}
                    screenSpacePanning={true}
                    minDistance={10}
                    maxDistance={200}
                    zoomSpeed={0.6}
                    rotateSpeed={0.4}
                    dampingFactor={0.08}
                    enableDamping
                    />
            </Canvas>
        </div>
    );
}