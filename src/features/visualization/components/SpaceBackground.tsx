// src/features/visualization/components/SpaceBackground.tsx

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Generates a procedural deep space skybox texture on a canvas.
 * Layers (back to front):
 *  1. Deep space base — near black with subtle purple/blue gradient
 *  2. Nebula clouds   — soft additive blobs of purple, blue, faint teal
 *  3. Milky Way band  — diagonal diffuse glow across the sphere
 *  4. Star field      — three size classes, randomized brightness
 *
 * Rendered once into a CanvasTexture — zero per-frame cost.
 */
function generateSpaceTexture(): THREE.CanvasTexture {
    const SIZE = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // ── Layer 1: Deep space base ──────────────────────────────────────
    const baseGrad = ctx.createRadialGradient(
        SIZE * 0.5, SIZE * 0.5, 0,
        SIZE * 0.5, SIZE * 0.5, SIZE * 0.85
    );
    baseGrad.addColorStop(0,    '#0a0614');
    baseGrad.addColorStop(0.4,  '#060410');
    baseGrad.addColorStop(0.75, '#03020c');
    baseGrad.addColorStop(1,    '#010108');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Layer 2: Nebula cloud blobs ───────────────────────────────────
    const nebulae = [
        { x: 0.15, y: 0.25, r: 0.28, color: '#2a0a4a', alpha: 0.55 },
        { x: 0.75, y: 0.15, r: 0.22, color: '#0a1a4a', alpha: 0.45 },
        { x: 0.55, y: 0.70, r: 0.32, color: '#1a0a3a', alpha: 0.50 },
        { x: 0.85, y: 0.60, r: 0.20, color: '#0a2a3a', alpha: 0.35 },
        { x: 0.30, y: 0.80, r: 0.18, color: '#2a1a4a', alpha: 0.40 },
        { x: 0.60, y: 0.30, r: 0.15, color: '#0a0a3a', alpha: 0.30 },
        { x: 0.20, y: 0.55, r: 0.24, color: '#1a0a2a', alpha: 0.35 },
    ];

    nebulae.forEach(({ x, y, r, color, alpha }) => {
        const grad = ctx.createRadialGradient(
            SIZE * x, SIZE * y, 0,
            SIZE * x, SIZE * y, SIZE * r
        );
        grad.addColorStop(0,   color + 'aa');
        grad.addColorStop(0.4, color + '55');
        grad.addColorStop(1,   'transparent');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SIZE, SIZE);
    });

    // ── Layer 3: Milky Way band ───────────────────────────────────────
    // Diagonal diffuse glow — runs top-right to bottom-left
    ctx.globalAlpha = 1;
    const mwGrad = ctx.createLinearGradient(SIZE, 0, 0, SIZE);
    mwGrad.addColorStop(0,    'transparent');
    mwGrad.addColorStop(0.30, 'transparent');
    mwGrad.addColorStop(0.42, 'rgba(60, 40, 90, 0.18)');
    mwGrad.addColorStop(0.50, 'rgba(80, 60, 120, 0.28)');
    mwGrad.addColorStop(0.58, 'rgba(60, 40, 90, 0.18)');
    mwGrad.addColorStop(0.70, 'transparent');
    mwGrad.addColorStop(1,    'transparent');
    ctx.fillStyle = mwGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Secondary Milky Way density variation
    const mwGrad2 = ctx.createLinearGradient(SIZE * 0.8, 0, SIZE * 0.2, SIZE);
    mwGrad2.addColorStop(0,    'transparent');
    mwGrad2.addColorStop(0.35, 'transparent');
    mwGrad2.addColorStop(0.45, 'rgba(40, 30, 70, 0.12)');
    mwGrad2.addColorStop(0.55, 'rgba(40, 30, 70, 0.12)');
    mwGrad2.addColorStop(0.65, 'transparent');
    mwGrad2.addColorStop(1,    'transparent');
    ctx.fillStyle = mwGrad2;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Layer 4: Star field ───────────────────────────────────────────
    // Three size classes — distant, mid, foreground

    // Class A — tiny distant stars (1px)
    const STAR_COUNT_A = 2200;
    for (let i = 0; i < STAR_COUNT_A; i++) {
        const x = Math.random() * SIZE;
        const y = Math.random() * SIZE;
        const brightness = 0.3 + Math.random() * 0.5;
        // Slight color variation — some warm, some cool
        const tint = Math.random();
        const r = tint > 0.7 ? 220 : tint > 0.4 ? 200 : 180;
        const g = tint > 0.7 ? 210 : tint > 0.4 ? 210 : 200;
        const b = tint > 0.7 ? 190 : tint > 0.4 ? 230 : 255;
        ctx.globalAlpha = brightness;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
    }

    // Class B — mid stars (1.5px with soft glow)
    const STAR_COUNT_B = 600;
    for (let i = 0; i < STAR_COUNT_B; i++) {
        const x = Math.random() * SIZE;
        const y = Math.random() * SIZE;
        const brightness = 0.5 + Math.random() * 0.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 2.5);
        grad.addColorStop(0,   `rgba(220, 230, 255, ${brightness})`);
        grad.addColorStop(0.4, `rgba(200, 215, 255, ${brightness * 0.4})`);
        grad.addColorStop(1,   'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Class C — bright foreground stars with cross diffraction spike
    const STAR_COUNT_C = 35;
    for (let i = 0; i < STAR_COUNT_C; i++) {
        const x = Math.random() * SIZE;
        const y = Math.random() * SIZE;
        const size = 1.5 + Math.random() * 2.5;

        // Core glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        grad.addColorStop(0,   'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.1, 'rgba(220, 235, 255, 0.8)');
        grad.addColorStop(0.4, 'rgba(180, 210, 255, 0.2)');
        grad.addColorStop(1,   'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Diffraction spikes
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 8, y);
        ctx.lineTo(x + size * 8, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - size * 8);
        ctx.lineTo(x, y + size * 8);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(canvas);
}

/**
 * SpaceBackground — procedural deep space skybox.
 * Large inverted sphere surrounding the entire scene.
 * Rendered on BackSide so the texture faces inward.
 *
 * Features:
 *  - Deep purple/blue nebula clouds
 *  - Milky Way diagonal band
 *  - Three classes of stars including bright stars with diffraction spikes
 *
 * Generated once on mount — zero per-frame cost.
 */
export function SpaceBackground() {
    const texture = useMemo(() => generateSpaceTexture(), []);

    return (
        <mesh>
            <sphereGeometry args={[400, 64, 64]} />
            <meshBasicMaterial
                map={texture}
                side={2}
                depthWrite={false}
            />
        </mesh>
    );
}