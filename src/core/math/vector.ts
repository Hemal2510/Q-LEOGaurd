export type Vector3D = [number, number, number];

/**
 * Adds two 3D vectors.
 */
export const add = (v1: Vector3D, v2: Vector3D): Vector3D => [
    v1[0] + v2[0],
    v1[1] + v2[1],
    v1[2] + v2[2]
];

/**
 * Subtracts vector v2 from vector v1.
 */
export const subtract = (v1: Vector3D, v2: Vector3D): Vector3D => [
    v1[0] - v2[0],
    v1[1] - v2[1],
    v1[2] - v2[2]
];

/**
 * Scales a 3D vector by a scalar factor.
 */
export const scale = (v: Vector3D, factor: number): Vector3D => [
    v[0] * factor,
    v[1] * factor,
    v[2] * factor
];

/**
 * Computes the dot product of two 3D vectors.
 */
export const dot = (v1: Vector3D, v2: Vector3D): number =>
    v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];

/**
 * Computes the cross product of two 3D vectors.
 */
export const cross = (v1: Vector3D, v2: Vector3D): Vector3D => [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
];

/**
 * Computes the magnitude (length) of a 3D vector.
 */
export const magnitude = (v: Vector3D): number =>
    Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

/**
 * Computes the squared magnitude of a 3D vector (saves a square root).
 */
export const magnitudeSq = (v: Vector3D): number =>
    v[0] * v[0] + v[1] * v[1] + v[2] * v[2];

/**
 * Normalizes a 3D vector (returns a unit vector in the same direction).
 * Returns [0, 0, 0] if the vector's magnitude is 0.
 */
export const normalize = (v: Vector3D): Vector3D => {
    const mag = magnitude(v);
    if (mag === 0) return [0, 0, 0];
    return [v[0] / mag, v[1] / mag, v[2] / mag];
};