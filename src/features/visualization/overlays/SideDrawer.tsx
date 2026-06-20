// src/features/visualization/overlays/SideDrawer.tsx

import { useCallback } from 'react';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import type { SimulationState } from '../../../simulation/SimulationState';

type DrawerType = 'satellites' | 'forces' | 'settings' | null;

const TIME_SCALES = [1, 10, 60, 300, 600, 3600];

interface SideDrawerProps {
    activeDrawer: DrawerType;
    simState: SimulationState;
}

/**
 * SideDrawer — slide-in panel triggered by SideRail buttons.
 * Slides in from the right, sits just left of the rail.
 * Never covers more than 260px of horizontal canvas space.
 *
 * Panels:
 *  - satellites  → tracked object list with altitude + regime
 *  - forces      → force model toggles
 *  - settings    → time scale presets
 */
export function SideDrawer({ activeDrawer, simState }: SideDrawerProps) {
    const engine = SimulationEngine.getInstance();

    const handleToggleForce = useCallback((name: string) => {
        engine.toggleForce(name);
    }, []);

    const handleTimeScale = useCallback((scale: number) => {
        engine.setTimeScale(scale);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            right: activeDrawer ? 58 : -300,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 260,
            maxHeight: '70vh',
            background: 'rgba(6, 13, 26, 0.92)',
            border: '0.5px solid #1a3a5c',
            borderRadius: 12,
            padding: '14px 16px',
            backdropFilter: 'blur(12px)',
            pointerEvents: activeDrawer ? 'auto' : 'none',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            zIndex: 19,
        }}>

            {/* Satellites panel */}
            {activeDrawer === 'satellites' && (
                <SatellitesPanel simState={simState} />
            )}

            {/* Forces panel */}
            {activeDrawer === 'forces' && (
                <ForcesPanel
                    simState={simState}
                    onToggleForce={handleToggleForce}
                />
            )}

            {/* Settings panel */}
            {activeDrawer === 'settings' && (
                <SettingsPanel
                    simState={simState}
                    onTimeScale={handleTimeScale}
                />
            )}

        </div>
    );
}

// ─── Drawer panels ────────────────────────────────────────────────────────────

function SatellitesPanel({ simState }: { simState: SimulationState }) {
    const engine = SimulationEngine.getInstance();
    return (
        <div>
            <DrawerTitle>Tracked Objects</DrawerTitle>
            {simState.satellites.map((sat) => {
                const altM =
                    Math.sqrt(
                        sat.state.position[0] ** 2 +
                        sat.state.position[1] ** 2 +
                        sat.state.position[2] ** 2
                    ) - 6_371_000;

                const altKm = (altM / 1000).toFixed(0);
                const regime =
                    altM < 2_000_000 ? 'LEO' :
                        altM < 35_000_000 ? 'MEO' : 'GEO';
                const color =
                    altM < 2_000_000 ? '#7dd3fc' :
                        altM < 35_000_000 ? '#86efac' : '#fcd34d';
                const isSelected =
                    sat.id === simState.selectedSatelliteId;

                return (
                    <div
                        key={sat.id}
                        onClick={() => engine.selectSatellite(sat.id)}
                        style={{
                            padding: '8px',
                            borderBottom: '0.5px solid #1a3a5c',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',

                            cursor: 'pointer',

                            background: isSelected
                                ? 'rgba(55,138,221,0.15)'
                                : 'transparent',

                            borderRadius: 6,

                            transition: 'all 0.15s',
                        }}
                        >
                        <div>
                            <div style={{
                                fontSize: 11,
                                color: '#a8d8f0',
                                fontWeight: 500,
                                fontFamily: 'monospace',
                            }}>
                                {sat.name}
                            </div>
                            <div style={{
                                fontSize: 10,
                                color: '#3d6a8a',
                                marginTop: 2,
                                fontFamily: 'monospace',
                            }}>
                                {altKm} km
                            </div>
                        </div>
                        <div style={{
                            fontSize: 10,
                            color,
                            border: `0.5px solid ${color}44`,
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                        }}>
                            {regime}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ForcesPanel({
                         simState,
                         onToggleForce,
                     }: {
    simState: SimulationState;
    onToggleForce: (name: string) => void;
}) {
    return (
        <div>
            <DrawerTitle>Force Models</DrawerTitle>
            {simState.forces.map((force) => (
                <div
                    key={force.name}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '0.5px solid #1a3a5c',
                    }}
                >
                    <div style={{
                        fontSize: 11,
                        color: '#a8d8f0',
                        fontFamily: 'monospace',
                    }}>
                        {force.name}
                    </div>

                    {/* Toggle switch */}
                    <button
                        onClick={() => onToggleForce(force.name)}
                        title={force.enabled ? 'Disable' : 'Enable'}
                        style={{
                            width: 36,
                            height: 20,
                            borderRadius: 10,
                            border: 'none',
                            background: force.enabled ? '#1d9e75' : '#1a3a5c',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 2,
                            left: force.enabled ? 18 : 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s',
                        }} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function SettingsPanel({
                           simState,
                           onTimeScale,
                       }: {
    simState: SimulationState;
    onTimeScale: (scale: number) => void;
}) {
    return (
        <div>
            <DrawerTitle>Settings</DrawerTitle>

            <div style={{
                fontSize: 10,
                color: '#3d6a8a',
                marginBottom: 8,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
            }}>
                Time Scale
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
            }}>
                {TIME_SCALES.map((scale) => (
                    <button
                        key={scale}
                        onClick={() => onTimeScale(scale)}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `0.5px solid ${
                                simState.timeScale === scale ? '#378add' : '#1a3a5c'
                            }`,
                            background: simState.timeScale === scale
                                ? 'rgba(22, 61, 106, 0.9)'
                                : 'transparent',
                            color: simState.timeScale === scale ? '#7dd3fc' : '#3d6a8a',
                            fontSize: 11,
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.15s',
                        }}
                    >
                        {scale}×
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Shared internal component ────────────────────────────────────────────────

function DrawerTitle({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: 10,
            color: '#4a8ab0',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 10,
            paddingBottom: 8,
            borderBottom: '0.5px solid #1a3a5c',
            fontFamily: 'monospace',
        }}>
            {children}
        </div>
    );
}