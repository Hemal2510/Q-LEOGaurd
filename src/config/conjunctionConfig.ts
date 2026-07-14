/** Distance threshold for conjunction screening — objects closer than this at TCA are flagged (meters) */
export const CONJUNCTION_DISTANCE_THRESHOLD_METERS = 5000; // 5 km — Watch threshold

/**
 * Maximum trusted time-to-closest-approach for the linearized TCA solution (seconds).
 * Linear (constant-velocity) extrapolation degrades as t_tca grows — orbital
 * curvature isn't captured by a straight line. Beyond this window, a predicted
 * "conjunction" is more linear-approximation error than real signal.
 */
export const MAX_TCA_LOOKAHEAD_SECONDS = 300; // 5 minutes

/** Reference max relative closing speed for risk normalization (m/s) — worst-case retrograde vs prograde LEO crossing */
export const MAX_REFERENCE_CLOSING_SPEED_MPS = 15000;

/** Risk score weights — must sum to 1 */
export const RISK_WEIGHT_DISTANCE = 0.7;
export const RISK_WEIGHT_VELOCITY = 0.3;