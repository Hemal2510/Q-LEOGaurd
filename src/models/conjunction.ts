export interface ConjunctionEvent {
    id: string;

    satelliteAId: string;
    satelliteBId: string;

    distanceMeters: number;

    simulationTimestamp: number;
}