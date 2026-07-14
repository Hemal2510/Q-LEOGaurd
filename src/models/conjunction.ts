export interface ConjunctionEvent {
    id: string;

    satelliteAId: string;
    satelliteBId: string;

    distanceMeters: number;              // current snapshot separation (m) — informational only, NOT what drives detection anymore

    relativeVelocityMps: number;         // |v_rel| between the pair (m/s)
    timeToClosestApproachSeconds: number;// predicted seconds to closest approach (linearized TCA)
    missDistanceMeters: number;          // predicted separation AT TCA (m) — this drives the threshold check

    riskScore: number;                   // heuristic 0-100. NOT a collision probability (Pc) — that's Phase 3.

    simulationTimestamp: number;
}