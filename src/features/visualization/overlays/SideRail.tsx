// src/features/visualization/overlays/SideRail.tsx

type DrawerType = 'satellites' | 'forces' | 'settings' | null;

interface SideRailProps {
    activeDrawer: DrawerType;
    onToggle: (drawer: DrawerType) => void;
}

/**
 * Rail button configuration.
 */
const RAIL_BUTTONS: {
    id: DrawerType;
    icon: string;
    label: string;
}[] = [
    { id: 'satellites', icon: '◎', label: 'Satellites' },
    { id: 'forces',     icon: '⚡', label: 'Force Models' },
    { id: 'settings',  icon: '⚙', label: 'Settings' },
];

/**
 * SideRail — vertical icon button strip on the right edge of the canvas.
 * Each button toggles a corresponding SideDrawer panel.
 * Nothing open by default — clean canvas on load.
 */
export function SideRail({ activeDrawer, onToggle }: SideRailProps) {
    return (
        <div style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'auto',
            zIndex: 20,
        }}>
            {RAIL_BUTTONS.map((btn) => (
                <RailButton
                    key={btn.id}
                    icon={btn.icon}
                    label={btn.label}
                    active={activeDrawer === btn.id}
                    onClick={() => onToggle(btn.id)}
                />
            ))}
        </div>
    );
}

// ─── Internal component ───────────────────────────────────────────────────────

function RailButton({
                        icon,
                        label,
                        active,
                        onClick,
                    }: {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `0.5px solid ${active ? '#378add' : '#1a3a5c'}`,
                background: active
                    ? 'rgba(22, 61, 106, 0.85)'
                    : 'rgba(8, 16, 32, 0.75)',
                color: active ? '#7dd3fc' : '#4a8ab0',
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s',
            }}
        >
            {icon}
        </button>
    );
}