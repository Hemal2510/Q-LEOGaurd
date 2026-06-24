import type { Satellite } from '../models/satellite';
import type { ConjunctionEvent } from '../models/conjunction';

import {
    subtract,
    magnitude,
    magnitudeSq
} from '../core/math/vector';

import {
    CONJUNCTION_DISTANCE_THRESHOLD_METERS
} from '../config/conjunctionConfig';

/**
 * Detects close approaches between satellites.
 *
 * V1:
 * Pure distance-based conjunction detection.
 *
 * Future versions will add:
 * - Relative velocity
 * - Time of Closest Approach (TCA)
 * - Risk scoring
 */
export class ConjunctionDetector {
    private readonly thresholdSq: number;

    constructor() {
        this.thresholdSq =
            CONJUNCTION_DISTANCE_THRESHOLD_METERS *
            CONJUNCTION_DISTANCE_THRESHOLD_METERS;
    }

    public detect(
        satellites: Satellite[],
        simulationTimestamp: number
    ): ConjunctionEvent[] {

        const events: ConjunctionEvent[] = [];

        for (let i = 0; i < satellites.length; i++) {
            for (let j = i + 1; j < satellites.length; j++) {

                const satA = satellites[i];
                const satB = satellites[j];

                const separation = subtract(
                    satA.state.position,
                    satB.state.position
                );

                const distanceSq = magnitudeSq(separation);

                if (distanceSq > this.thresholdSq) {
                    continue;
                }

                events.push({
                    id: `${satA.id}-${satB.id}`,

                    satelliteAId: satA.id,
                    satelliteBId: satB.id,

                    distanceMeters: magnitude(separation),

                    simulationTimestamp,
                });
            }
        }

        return events;
    }
}