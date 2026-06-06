// src/features/visualization/overlays/PlatformUI.tsx

import { useState, useEffect } from 'react';
import { SimulationEngine } from '../../../simulation/SimulationEngine';
import type { SimulationState } from '../../../simulation/SimulationState';
import { Topbar } from './Topbar';
import { BottomBar } from './BottomBar';
import { SideRail } from './SideRail';
import { SideDrawer } from './SideDrawer';

type DrawerType = 'satellites' | 'forces' | 'settings' | null;

export function PlatformUI() {
    const engine = SimulationEngine.getInstance();
    const [simState, setSimState] = useState<SimulationState>(engine.getState());
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

    useEffect(() => {
        return engine.subscribe(setSimState);
    }, []);

    const toggleDrawer = (drawer: DrawerType) => {
        setActiveDrawer((prev) => (prev === drawer ? null : drawer));
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
        }}>
            <Topbar simState={simState} />
            <SideRail activeDrawer={activeDrawer} onToggle={toggleDrawer} />
            <SideDrawer activeDrawer={activeDrawer} simState={simState} />
            <BottomBar simState={simState} />
        </div>
    );
}