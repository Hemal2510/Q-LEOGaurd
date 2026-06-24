import type { SimulationState } from '../../../simulation/SimulationState';

interface ConjunctionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    simState: SimulationState;
}

export function ConjunctionDrawer({
                                      isOpen,
                                      onClose,
                                      simState,
                                  }: ConjunctionDrawerProps) {

    const sortedEvents = [...simState.activeConjunctions]
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '320px',
                height: '100%',
                background: '#0b1220',
                borderRight: '1px solid rgba(56,189,248,0.2)',
                transform: isOpen
                    ? 'translateX(0)'
                    : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                pointerEvents: 'auto',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    borderBottom: '1px solid rgba(56,189,248,0.2)',
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            color: '#67e8f9',
                            fontSize: '18px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                        }}
                    >
                        CONJUNCTION CENTER
                    </h2>

                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: '#64748b',
                            fontFamily: 'monospace',
                        }}
                    >
                        Active Events: {sortedEvents.length}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#67e8f9',
                        fontSize: '20px',
                        cursor: 'pointer',
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Event List */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                }}
            >
                {sortedEvents.length === 0 ? (
                    <div
                        style={{
                            color: '#64748b',
                            fontSize: 12,
                            fontFamily: 'monospace',
                        }}
                    >
                        No active conjunctions detected.
                    </div>
                ) : (
                    sortedEvents.map((event) => {
                        const satA = simState.satellites.find(
                            sat => sat.id === event.satelliteAId
                        );

                        const satB = simState.satellites.find(
                            sat => sat.id === event.satelliteBId
                        );

                        return (
                            <div
                                key={event.id}
                                style={{
                                    marginBottom: 10,
                                    padding: 12,
                                    borderRadius: 8,
                                    border: '1px solid rgba(248,113,113,0.15)',
                                    background:
                                        'rgba(248,113,113,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#e2e8f0',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {satA?.name ?? event.satelliteAId}
                                </div>

                                <div style={{ fontSize: 10, color: '#64748b' }}>
                                    A: {event.satelliteAId}
                                </div>

                                <div
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: 10,
                                        margin: '4px 0',
                                    }}
                                >
                                    ↕
                                </div>

                                <div
                                    style={{
                                        color: '#e2e8f0',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {satB?.name ?? event.satelliteBId}
                                </div>

                                <div style={{ fontSize: 10, color: '#64748b' }}>
                                    B: {event.satelliteBId}
                                </div>

                                <div
                                    style={{
                                        marginTop: 8,
                                        color: '#f87171',
                                        fontSize: 11,
                                        fontFamily: 'monospace',
                                    }}
                                >


                                    Distance:{' '}
                                    {(event.distanceMeters / 1000).toFixed(2)} km
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}