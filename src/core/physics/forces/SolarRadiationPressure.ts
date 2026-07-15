import type {
  OrbitalState,
  PhysicalProperties,
} from '../../../models/satellite';

import type { Vector3D } from '../../math/vector';

import {
  dot,
  magnitude,
  normalize,
  scale,
  subtract,
} from '../../math/vector';

import type { ForceModel } from './ForceModel';

import {
  ASTRONOMICAL_UNIT,
  EARTH_RADIUS,
  SOLAR_RADIATION_PRESSURE_1_AU,
} from '../../../config/constants';

import { getSunPosition } from '../../ephemeris/sunEphemeris';

/**
 * Solar Radiation Pressure (SRP)
 * Acceleration:
 * a = P0 × Cr × (A / m) × (AU / d)^2 × direction
 */
export class SolarRadiationPressure implements ForceModel {
  readonly name = 'Solar Radiation Pressure';

  public enabled = true;

  /**
   * Returns true when the satellite lies inside a simplified cylindrical
   * shadow cast by Earth.
   *
   * @param satellitePosition Earth-to-satellite vector in ECI coordinates
   * @param sunPosition Earth-to-Sun vector in ECI coordinates
   */
  private isInEarthShadow(
    satellitePosition: Vector3D,
    sunPosition: Vector3D,
  ): boolean {
    const sunDirection = normalize(sunPosition);

    /*
     * Projection of satellite position along the Earth-to-Sun direction.
     * projection > 0: satellite is on the Sun-facing side of Earth
     * projection < 0: satellite is behind Earth
     */
    const projection = dot(satellitePosition, sunDirection);

    if (projection >= 0) {
      return false;
    }

    /*
     * Find the satellite's perpendicular distance from the Earth-Sun axis.
     */
    const parallelComponent = scale(sunDirection, projection);

    const perpendicularComponent = subtract(
      satellitePosition,
      parallelComponent,
    );

    const distanceFromShadowAxis = magnitude(perpendicularComponent);

    return distanceFromShadowAxis <= EARTH_RADIUS;
  }

  /**
   * Calculates solar-radiation-pressure acceleration in the ECI frame.
   */
  calculateAcceleration(
    state: OrbitalState,
    properties: PhysicalProperties,
    epoch: number,
  ): Vector3D {
    const mass = properties.mass;
    const area = properties.crossSectionArea;

    /*
     * SRP cannot be calculated without a positive mass and illuminated area.
     * Returning zero keeps the force model safe for incomplete TLE objects.
     */
    if (
      mass === undefined ||
      area === undefined ||
      !Number.isFinite(mass) ||
      !Number.isFinite(area) ||
      mass <= 0 ||
      area <= 0
    ) {
      return [0, 0, 0];
    }

    /*
     * Cr describes how strongly the surface interacts with sunlight.
     *
     * Cr ≈ 1: mostly absorbing surface
     * Cr ≈ 2: highly reflective surface
     */
    const radiationCoefficient =
      properties.radiationPressureCoefficient ?? 1.2;

    if (
      !Number.isFinite(radiationCoefficient) ||
      radiationCoefficient < 0
    ) {
      return [0, 0, 0];
    }

    const satellitePosition = state.position;
    const sunPosition = getSunPosition(epoch);

    /*
     * Ignore SRP while the satellite is eclipsed by Earth.
     */
    if (this.isInEarthShadow(satellitePosition, sunPosition)) {
      return [0, 0, 0];
    }

    /*
     * Vector from the Sun to the satellite.
     *
     * Photons travel from the Sun toward the satellite, so SRP acceleration
     * acts in this direction: away from the Sun.
     */
    const sunToSatellite = subtract(
      satellitePosition,
      sunPosition,
    );

    const distanceFromSun = magnitude(sunToSatellite);

    if (distanceFromSun === 0) {
      return [0, 0, 0];
    }

    const directionAwayFromSun = normalize(sunToSatellite);

    /*
     * Solar pressure follows the inverse-square law.
     */
    const pressureAtSatellite =
      SOLAR_RADIATION_PRESSURE_1_AU *
      Math.pow(ASTRONOMICAL_UNIT / distanceFromSun, 2);

    const accelerationMagnitude =
      pressureAtSatellite *
      radiationCoefficient *
      (area / mass);

    return scale(directionAwayFromSun, accelerationMagnitude);
  }
}