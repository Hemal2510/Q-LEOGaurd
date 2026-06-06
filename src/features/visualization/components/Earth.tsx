// src/features/visualization/components/Earth.tsx

import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { Mesh } from 'three';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';
import { SimulationEngine } from '../../../simulation/SimulationEngine';

/**
 * Earth — textured sphere representing the central body.
 * Rotates in sync with simulation epoch to approximate
 * real sidereal rotation rate.
 *
 * Rendered at 1.0 WebGL units diameter.
 * Real Earth radius = 6,371,000m → scaled by distanceScale (1e-6) = 6.371 units.
 * Sphere radius set to EARTH_RADIUS * distanceScale for physical accuracy.
 *
 * Textures loaded from public/assets/textures/.
 * Falls back to solid color material if textures are unavailable.
 */
export function Earth() {
    const meshRef = useRef<Mesh>(null);
    const engine = SimulationEngine.getInstance();

    // Earth radius in WebGL units
    // 6,371,000m * 1e-6 distanceScale = 6.371 units
    const EARTH_RADIUS_SCALED = 6_371_000 * SIM_DEFAULT_CONFIG.distanceScale;

    // Sidereal rotation rate in radians per second
    // Full rotation (2π) in 86,164.1s (sidereal day)
    const EARTH_ROTATION_RATE = (2 * Math.PI) / 86_164.1;

    useFrame(() => {
        if (!meshRef.current) return;
        // Rotate Earth based on simulation epoch
        meshRef.current.rotation.y =
            engine.getEpoch() * EARTH_ROTATION_RATE;
    });

    return (
        <group>
            {/* Main Earth sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[EARTH_RADIUS_SCALED, 64, 64]} />
                <meshPhongMaterial
                    color="#1a4a7a"
                    emissive="#041428"
                    specular="#336699"
                    shininess={18}
                />
            </mesh>

            {/* Inner atmosphere glow layer */}
            <mesh>
                <sphereGeometry args={[EARTH_RADIUS_SCALED * 1.025, 32, 32]} />
                <meshPhongMaterial
                    color="#1a6aaa"
                    transparent
                    opacity={0.10}
                    depthWrite={false}
                />
            </mesh>

            {/* Outer atmosphere haze layer */}
            <mesh>
                <sphereGeometry args={[EARTH_RADIUS_SCALED * 1.055, 32, 32]} />
                <meshPhongMaterial
                    color="#0a3a8a"
                    transparent
                    opacity={0.05}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}