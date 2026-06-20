// src/features/visualization/overlays/LoadingScreen.tsx

interface LoadingScreenProps {
    progress: number;
    message: string;
}

export function LoadingScreen({
                                  progress,
                                  message,
                              }: LoadingScreenProps) {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background:
                    'radial-gradient(circle at center, #0d1b2a 0%, #060d1a 70%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden',
            }}
        >
            {/* Earth */}
            <div
                style={{
                    fontSize: 80,
                    marginBottom: 20,
                    animation: 'spin 12s linear infinite',
                    filter: 'drop-shadow(0 0 20px rgba(125,211,252,0.4))',
                }}
            >
                🌍
            </div>

            {/* Title */}
            <div
                style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#7dd3fc',
                    letterSpacing: '0.12em',
                    marginBottom: 10,
                }}
            >
                Q-LEOGUARD
            </div>

            {/* Subtitle */}
            <div
                style={{
                    color: '#94a3b8',
                    fontSize: 14,
                    letterSpacing: '0.08em',
                    marginBottom: 32,
                }}
            >
                INITIALIZING ORBITAL ENVIRONMENT
            </div>

            {/* Progress Bar Container */}
            <div
                style={{
                    width: 360,
                    height: 10,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    border: '1px solid rgba(125,211,252,0.15)',
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: '100%',
                        background:
                            'linear-gradient(90deg, #38bdf8, #7dd3fc)',
                        transition: 'width 0.4s ease',
                    }}
                />
            </div>

            {/* Percentage */}
            <div
                style={{
                    marginTop: 12,
                    color: '#7dd3fc',
                    fontSize: 13,
                    fontFamily: 'monospace',
                }}
            >
                {Math.round(progress)}%
            </div>

            {/* Status */}
            <div
                style={{
                    marginTop: 24,
                    color: '#cbd5e1',
                    fontSize: 14,
                    minHeight: 20,
                }}
            >
                {message}
            </div>

            {/* Footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 40,
                    color: '#475569',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    fontFamily: 'monospace',
                }}
            >
                QUANTUM • ORBITAL • TRAFFIC • OPTIMIZATION
            </div>

            <style>
                {`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
}