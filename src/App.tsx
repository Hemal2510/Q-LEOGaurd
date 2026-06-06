import { OrbitalCanvas } from './features/visualization/scene/OrbitalCanvas';

export default function App() {
    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <OrbitalCanvas />
        </div>
    );
}