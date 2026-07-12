// src/config/constants.ts

/**
 * Earth gravitational parameter (WGS-84 standard).
 * Units: m³/s²
 */
export const EARTH_MU = 3.986004418e14;

/**
 * Earth mean radius.
 * Units: meters
 */
export const EARTH_RADIUS = 6_371_000;

/**
 * Earth sidereal rotation rate.
 * Units: radians/second
 */
export const EARTH_ROTATION_RATE = (2 * Math.PI) / 86_164.1;

/**
 * J2 zonal harmonic coefficient (Earth oblateness perturbation).
 * Dimensionless. Reserved for J2Force — do not use in Phase 1.
 */
export const EARTH_J2 = 1.08262668e-3;

/** 
 * Moon gravitational parameter (JPL Planetary Ephemeris).
 * Units : m³/s²
 */ 
export const MOON_MU = 4902800118 ;

/**
 * Sun gravitational parameter (JPL Planetary Ephemeris).
 *  Units : m³/s²
 */
export const SUN_MU = 1.3271244e20;