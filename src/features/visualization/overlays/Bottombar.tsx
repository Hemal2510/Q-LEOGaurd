// src/features/visualization/overlays/BottomBar.tsx

import { useCallback } from 'react';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import type { SimulationState } from '../../../simulation/SimulationState';

/**
 * Available time scale presets in simulation seconds per real second.
 */
const TIME_SCALES = [1, 10, 60, 300, 600, 3600];

interface BottomBarProps {
    simState: SimulationState;
}

/**
 * BottomBar — pill-shaped simulation control bar.
 * Centered at bottom of canvas. Never covers more than 60px of screen.
 *
 * Contains:
 *  - Play / Pause toggle
 *  - Time scale presets
 *  - Reset button
 */
export function BottomBar({ simState }: BottomBarProps) {
    const engine = SimulationEngine.getInstance();

    const handleTogglePause = useCallback(() => {
        engine.togglePause();
    }, []);

    const handleReset = useCallback(() => {
        engine.reset();
    }, []);

    const handleTimeScale = useCallback((scale: number) => {
        engine.setTimeScale(scale);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(8, 16, 32, 0.88)',
            border: '0.5px solid #1a3a5c',
            borderRadius: 40,
            padding: '8px 16px',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            zIndex: 20,
        }}>

            {/* Play / Pause */}
            <PillButton
                onClick={handleTogglePause}
                active={!simState.isPaused}
                title={simState.isPaused ? 'Play' : 'Pause'}
            >
                {simState.isPaused ? '▶' : '⏸'}
            </PillButton>

            <Divider />

            {/* Time scale presets */}
            {TIME_SCALES.map((scale) => (
                <PillButton
                    key={scale}
                    onClick={() => handleTimeScale(scale)}
                    active={simState.timeScale === scale}
                    title={`${scale}× speed`}
                >
                    <span style={{ fontSize: 10 }}>{scale}×</span>
                </PillButton>
            ))}

            <Divider />

            {/* Reset */}
            <PillButton
                onClick={handleReset}
                active={false}
                title="Reset simulation"
                danger
            >
                ↺
            </PillButton>
        </div>
    );
}

// ─── Internal components ─────────────────────────────────────────────────────

function PillButton({
                        children,
                        onClick,
                        active,
                        title,
                        danger = false,
                    }: {
    children: React.ReactNode;
    onClick: () => void;
    active: boolean;
    title: string;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                minWidth: 32,
                height: 32,
                borderRadius: 20,
                border: `0.5px solid ${
                    danger ? '#f8717144' :
                        active ? '#378add' : '#1a3a5c'
                }`,
                background: danger
                    ? 'transparent'
                    : active ? 'rgba(22, 61, 106, 0.9)' : 'transparent',
                color: danger ? '#f87171' : active ? '#7dd3fc' : '#4a8ab0',
                fontSize: 14,
                cursor: 'pointer',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                fontFamily: 'monospace',
            }}
        >
            {children}
        </button>
    );
}

function Divider() {
    return (
        <div style={{
            width: 0.5,
            height: 20,
            background: '#1a3a5c',
            margin: '0 4px',
        }} />
    );
}