// src/features/visualization/scene/OrbitalCanvas.tsx

import { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SpaceBackground } from '../components/SpaceBackground';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { Earth } from '../components/Earth';
import { Satellites } from '../components/Satellites';
import { OrbitPaths } from '../components/OrbitPaths';
import { PlatformUI } from '../overlays/PlatformUI';

/**
 * SceneLoop — drives the simulation engine every R3F frame.
 * Keeps the scene continuously dirty so satellite positions
 * and Earth rotation update without React state re-renders.
 */
function SceneLoop() {
    const engine = SimulationEngine.getInstance();

    useFrame(() => {
        engine.getSatellites();
    });

    return null;
}

/**
 * OrbitalCanvas — root Three.js scene for Q-LEOGuard.
 *
 * Architecture:
 *  Canvas (R3F)
 *  ├── SceneLoop        — drives engine per frame
 *  ├── SpaceBackground  — procedural deep space skybox
 *  ├── Earth            — NASA textured sphere with day/night shader
 *  ├── Satellites       — live position markers
 *  ├── OrbitPaths       — precomputed RK4 orbital trails
 *  ├── OrbitControls    — mouse rotate / zoom / pan
 *  └── Lights           — ambient + directional sun rig
 *  PlatformUI           — HTML overlay panels (outside Canvas)
 */
export function OrbitalCanvas() {
    const engine = SimulationEngine.getInstance();

    useEffect(() => {
        /**
         * StrictMode in React 18 mounts components twice in dev.
         * Guard against double-toggle by checking state before acting.
         * Without this guard: mount → start → unmount → stop → remount → start
         * but cleanup already fired so the loop never recovers.
         */
        if (engine.getState().isPaused) {
            engine.togglePause();
        }
        return () => {
            if (!engine.getState().isPaused) {
                engine.togglePause();
            }
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', background: '#060d1a', position: 'relative' }}>
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

                {/* Deep space background */}
                <SpaceBackground />

                {/* Lighting rig — sun from upper right, dim fill opposite */}
                <ambientLight intensity={0.25} color="#334455" />
                <directionalLight
                    position={[5, 3, 5]}
                    intensity={2.8}
                    color="#ffeedd"
                />
                <directionalLight
                    position={[-4, -2, -3]}
                    intensity={0.3}
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

            {/* HTML overlay — outside Canvas so pointer events work cleanly */}
            <PlatformUI />
        </div>
    );
}