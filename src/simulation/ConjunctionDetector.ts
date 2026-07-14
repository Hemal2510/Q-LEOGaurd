import type { Satellite } from '../models/satellite';
import type { ConjunctionEvent } from '../models/conjunction';

import {
    subtract,
    dot,
    magnitude,
    magnitudeSq,
    add,
    scale
} from '../core/math/vector';

import {
    CONJUNCTION_DISTANCE_THRESHOLD_METERS,
    MAX_TCA_LOOKAHEAD_SECONDS,
    MAX_REFERENCE_CLOSING_SPEED_MPS,
    RISK_WEIGHT_DISTANCE,
    RISK_WEIGHT_VELOCITY
} from '../config/conjunctionConfig';

/**
 * Detects close approaches between satellites using linearized TCA.
 *
 * V2:
 * - Relative velocity per pair
 * - Time of Closest Approach (TCA) via constant-velocity straight-line extrapolation
 * - Miss distance AT TCA drives the threshold check — not current snapshot distance
 * - Heuristic 0-100 risk score: 70% miss distance (quadratic), 30% closing speed (linear)
 *
 * This is a first-order linearized TCA — standard baseline method, valid for
 * short look-ahead windows. It is NOT full numerical propagation and does NOT
 * compute true collision probability (Pc via covariance / Alfriend-Akella —
 * that's Phase 3).
 *
 * Objects moving apart (t_tca < 0) are dropped as non-conjunctions. This also
 * resolves the parallel-LEO-shell false positive problem: co-moving satellites
 * have v_rel ≈ 0 and never converge, so they no longer register as threats
 * just because they sit close together.
 */
export class ConjunctionDetector {

    public detect(
        satellites: Satellite[],
        simulationTimestamp: number
    ): ConjunctionEvent[] {

        const events: ConjunctionEvent[] = [];

        for (let i = 0; i < satellites.length; i++) {
            for (let j = i + 1; j < satellites.length; j++) {

                const satA = satellites[i];
                const satB = satellites[j];

                if (satA.id === satB.id) {
                    continue;
                }

                const event = this.evaluatePair(satA, satB, simulationTimestamp);

                if (event) {
                    events.push(event);
                }
            }
        }

        return events;
    }

    /**
     * Evaluates a single pair. Returns null if diverging, outside the trusted
     * TCA lookahead window, or predicted miss distance exceeds threshold.
     */
    private evaluatePair(
        satA: Satellite,
        satB: Satellite,
        simulationTimestamp: number
    ): ConjunctionEvent | null {

        // Relative position, A w.r.t. B (m)
        const rRel = subtract(satA.state.position, satB.state.position);

        // Relative velocity, A w.r.t. B (m/s)
        const vRel = subtract(satA.state.velocity, satB.state.velocity);

        const currentDistance = magnitude(rRel);
        const relSpeedSq = magnitudeSq(vRel);

        // Zero-guard: no relative motion → no defined closest approach.
        // Co-moving objects (same shell/train) are not conjunctions.
        if (relSpeedSq === 0) {
            return null;
        }

        // t_tca = -(r_rel . v_rel) / (v_rel . v_rel)
        const tTca = -dot(rRel, vRel) / relSpeedSq;

        // Diverging — closest approach was in the past, not the future.
        if (tTca < 0) {
            return null;
        }

        // Beyond the trusted linear window — don't trust the extrapolation.
        if (tTca > MAX_TCA_LOOKAHEAD_SECONDS) {
            return null;
        }

        // Position at predicted TCA, and the miss distance there (m)
        const rAtTca = add(rRel, scale(vRel, tTca));
        const missDistance = magnitude(rAtTca);

        if (missDistance > CONJUNCTION_DISTANCE_THRESHOLD_METERS) {
            return null;
        }

        const relSpeed = magnitude(vRel);
        const riskScore = this.computeRiskScore(missDistance, relSpeed);

        return {
            id: `${satA.id}-${satB.id}`,
            satelliteAId: satA.id,
            satelliteBId: satB.id,
            distanceMeters: currentDistance,
            relativeVelocityMps: relSpeed,
            timeToClosestApproachSeconds: tTca,
            missDistanceMeters: missDistance,
            riskScore,
            simulationTimestamp,
        };
    }

    /**
     * Heuristic risk score in [0, 100]. NOT a collision probability.
     * 70% miss distance (quadratic falloff — risk climbs sharply only as
     * miss distance nears zero, not linearly across the whole threshold range),
     * 30% relative closing speed (linear — shorter reaction window and higher
     * impact energy on actual collision, not higher collision likelihood).
     */
    private computeRiskScore(missDistance: number, relSpeed: number): number {

        const distanceRatio = Math.min(
            missDistance / CONJUNCTION_DISTANCE_THRESHOLD_METERS,
            1
        );
        const distanceRisk = Math.pow(1 - distanceRatio, 2);

        const velocityRisk = Math.min(
            relSpeed / MAX_REFERENCE_CLOSING_SPEED_MPS,
            1
        );

        const combined =
            RISK_WEIGHT_DISTANCE * distanceRisk +
            RISK_WEIGHT_VELOCITY * velocityRisk;

        return Math.round(combined * 100);
    }
}