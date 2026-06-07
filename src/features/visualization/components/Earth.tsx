// src/features/visualization/components/Earth.tsx

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import { EARTH_RADIUS, EARTH_ROTATION_RATE } from '../../../config/constants';
import { SIM_DEFAULT_CONFIG } from '../../../config/simConfig';

const SCALED_RADIUS = EARTH_RADIUS * SIM_DEFAULT_CONFIG.distanceScale;

/**
 * Sun direction in world space — fixed, Earth rotates under it.
 * Units: normalized direction vector
 */
const SUN_DIRECTION = new THREE.Vector3(5, 3, 5).normalize();

const dayNightVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    // World-space normal — correct because we counter-rotate
    // the sun direction in the uniform each frame instead
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const dayNightFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunWorld;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec4 dayColor   = texture2D(dayTexture,   vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);

    float sunDot   = dot(normalize(vWorldNormal), sunWorld);
    float dayFactor = smoothstep(-0.08, 0.08, sunDot);

    vec4 nightBoosted = nightColor * 2.6;
    vec4 surface = mix(nightBoosted, dayColor, dayFactor);

    float spec = pow(max(0.0, sunDot), 32.0) * 0.10 * dayFactor;
    surface.rgb += vec3(spec * 0.5, spec * 0.7, spec);

    gl_FragColor = surface;
  }
`;

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
    gl_FragColor = vec4(0.1, 0.5, 1.0, 1.0) * intensity * 1.2;
  }
`;

/**
 * Earth — photorealistic rotating central body.
 *
 * Day/night technique:
 * Instead of transforming normals, we counter-rotate the sun direction
 * uniform by the negative of Earth's current rotation angle each frame.
 * This keeps the sun fixed in world space while Earth's geometry rotates —
 * producing a correct sweeping terminator line with zero shader complexity.
 */
export function Earth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const engine   = SimulationEngine.getInstance();

    const [dayMap, nightMap] = useLoader(TextureLoader, [
        '/src/assets/textures/earth_daymap.jpg',
        '/src/assets/textures/earth_nightmap.jpg',
    ]);

    const uniforms = useMemo(() => ({
        dayTexture:  { value: dayMap },
        nightTexture: { value: nightMap },
        sunWorld:    { value: new THREE.Vector3() },
    }), [dayMap, nightMap]);

    useFrame(() => {
        if (!earthRef.current) return;

        const rotation = engine.getEpoch() * EARTH_ROTATION_RATE;

        // Rotate Earth mesh
        earthRef.current.rotation.y = rotation;

        // Counter-rotate sun direction by Earth's rotation
        // This keeps the sun fixed in world space correctly
        const counterRotated = SUN_DIRECTION.clone().applyEuler(
            new THREE.Euler(0, -rotation, 0)
        );
        uniforms.sunWorld.value.copy(counterRotated);
    });

    return (
        <group>
            <mesh ref={earthRef}>
                <sphereGeometry args={[SCALED_RADIUS, 64, 64]} />
                <shaderMaterial
                    vertexShader={dayNightVertexShader}
                    fragmentShader={dayNightFragmentShader}
                    uniforms={uniforms}
                />
            </mesh>

            {/* Atmosphere glow */}
            <mesh scale={[1.08, 1.08, 1.08]}>
                <sphereGeometry args={[SCALED_RADIUS, 32, 32]} />
                <shaderMaterial
                    vertexShader={atmosphereVertexShader}
                    fragmentShader={atmosphereFragmentShader}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                    transparent
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}