// src/features/visualization/overlays/Topbar.tsx

import type { SimulationState } from '../../../simulation/SimulationState';

/**
 * Formats simulation epoch seconds into HH:MM:SS display string.
 * @param seconds Total simulation seconds elapsed
 */
function formatEpoch(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TopbarProps {
    simState: SimulationState;
}

/**
 * Topbar — persistent header overlay for the orbital canvas.
 * Always visible. Never blocks the 3D scene.
 *
 * Contains:
 *  - Q-LEOGUARD logo + live status indicator
 *  - Tracked satellite count
 *  - Live simulation epoch clock
 *  - Current time scale
 *  - Live / Paused status badge
 */
export function Topbar({ simState }: TopbarProps) {
    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: 'linear-gradient(to bottom, rgba(6,13,26,0.95), transparent)',
            pointerEvents: 'auto',
            zIndex: 20,
        }}>

            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                <div style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: simState.isPaused ? '#f87171' : '#1d9e75',
                    boxShadow: simState.isPaused
                        ? '0 0 6px #f87171'
                        : '0 0 6px #1d9e75',
                    transition: 'all 0.3s',
                }} />
                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#7dd3fc',
                    letterSpacing: '0.12em',
                    fontFamily: 'monospace',
                }}>
          Q-LEOGUARD
        </span>
            </div>

            {/* Stats */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
            }}>
                <Stat label="tracked" value={String(simState.satellites.length)} />
                <Stat label="epoch" value={formatEpoch(simState.epoch)} highlight />
                <Stat label="speed" value={`${simState.timeScale}×`} />

                {/* Live / Paused badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    color: simState.isPaused ? '#f87171' : '#1d9e75',
                    border: `0.5px solid ${simState.isPaused ? '#f8717144' : '#1d9e7544'}`,
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    letterSpacing: '0.06em',
                    transition: 'all 0.3s',
                }}>
                    <div style={{
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: simState.isPaused ? '#f87171' : '#1d9e75',
                    }} />
                    {simState.isPaused ? 'PAUSED' : 'LIVE'}
                </div>
            </div>
        </div>
    );
}

// ─── Internal component ──────────────────────────────────────────────────────

function Stat({
                  label,
                  value,
                  highlight = false,
              }: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div style={{
            fontSize: 11,
            color: '#4a8ab0',
            fontFamily: 'monospace',
        }}>
            {label}{' '}
            <span style={{
                color: highlight ? '#7dd3fc' : '#a8d8f0',
                fontWeight: 500,
            }}>
        {value}
      </span>
        </div>
    );
}