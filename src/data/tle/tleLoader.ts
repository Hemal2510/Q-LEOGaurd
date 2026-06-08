// src/data/tle/tleLoader.ts

import * as satellite from 'satellite.js';
import type { Satellite } from '../../models/satellite';

/**
 * Celestrak TLE group endpoints proxied through Vite dev server.
 * Proxy rewrites /celestrak/* → https://celestrak.org/*
 * Cache TTL matches Celestrak's 2-hour update cycle.
 */
const CELESTRAK_BASE = '/celestrak/NORAD/elements/gp.php';

/**
 * Cache TTL in milliseconds — 2 hours to match Celestrak update cycle.
 * Prevents HTTP 403 from repeated requests within the same update window.
 */
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * TLE group definitions.
 * Each group fetches a specific satellite population from Celestrak.
 * Count limits how many satellites we take from each group.
 */

const TLE_GROUPS: { group: string; count: number; category: string }[] = [
    // LEO — dense traffic
    { group: 'starlink',             count: 60,  category: 'satellite'    },
    { group: 'cosmos-2251-debris',   count: 30,  category: 'debris'       },
    { group: 'iridium-33-debris',    count: 20,  category: 'debris'       },

    // MEO — GPS, Galileo, GLONASS
    { group: 'gps-ops',              count: 32,  category: 'satellite'    },
    { group: 'galileo',              count: 25,  category: 'satellite'    },
    { group: 'glonass-ops',          count: 25,  category: 'satellite'    },

    // GEO — geostationary belt
    { group: 'geo',                  count: 30,  category: 'satellite'    },

    // Space stations
    { group: 'stations',             count: 10,  category: 'satellite'    },
];

/**
 * Cached TLE entry stored in localStorage.
 */
interface TLECache {
    /** Raw TLE text from Celestrak */
    data: string;
    /** Timestamp when this cache entry was stored — ms since epoch */
    timestamp: number;
}

/**
 * Parsed TLE entry — three lines from a TLE block.
 */
interface TLEEntry {
    name:  string;
    line1: string;
    line2: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

/**
 * Reads cached TLE data from localStorage.
 * Returns null if cache is missing or expired.
 *
 * @param group Celestrak group name
 * @returns Raw TLE text or null if cache miss
 */
function readCache(group: string): string | null {
    try {
        const raw = localStorage.getItem(`tle_cache_${group}`);
        if (!raw) return null;
        const cache: TLECache = JSON.parse(raw);
        const age = Date.now() - cache.timestamp;
        if (age > CACHE_TTL_MS) return null;
        return cache.data;
    } catch {
        return null;
    }
}

/**
 * Writes TLE data to localStorage with current timestamp.
 *
 * @param group Celestrak group name
 * @param data  Raw TLE text to cache
 */
function writeCache(group: string, data: string): void {
    try {
        const cache: TLECache = { data, timestamp: Date.now() };
        localStorage.setItem(`tle_cache_${group}`, JSON.stringify(cache));
    } catch {
        // localStorage full or unavailable — continue without caching
        console.warn(`TLE cache write failed for group: ${group}`);
    }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches raw TLE text for a Celestrak group.
 * Checks localStorage cache first — only hits the API on cache miss or expiry.
 *
 * @param group Celestrak group identifier
 * @returns Raw TLE text
 */
async function fetchTLEGroup(group: string): Promise<string> {
    const cached = readCache(group);
    if (cached) {
        console.log(`TLE cache hit: ${group}`);
        return cached;
    }

    console.log(`TLE fetch: ${group}`);
    const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=TLE`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Celestrak fetch failed for group "${group}": ${response.status} ${response.statusText}`
        );
    }

    const text = await response.text();
    writeCache(group, text);
    return text;
}

// ─── Parse ────────────────────────────────────────────────────────────────────

/**
 * Parses raw TLE text into structured TLE entries.
 * Handles both 2LE (no name line) and 3LE (with name line) formats.
 *
 * @param raw Raw TLE text from Celestrak
 * @returns Array of parsed TLE entries
 */
function parseTLEText(raw: string): TLEEntry[] {
    const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const entries: TLEEntry[] = [];

    for (let i = 0; i < lines.length - 1; i++) {
        const l = lines[i];

        // Line 1 starts with '1 ', Line 2 starts with '2 '
        if (l.startsWith('1 ') && i + 1 < lines.length && lines[i + 1].startsWith('2 ')) {
            // No name line — use catalog number as name
            const name = i > 0 && !lines[i - 1].startsWith('1 ') && !lines[i - 1].startsWith('2 ')
                ? lines[i - 1]
                : `SAT-${l.substring(2, 7).trim()}`;

            entries.push({ name, line1: l, line2: lines[i + 1] });
            i++; // skip line2
        }
    }

    return entries;
}

// ─── Convert ──────────────────────────────────────────────────────────────────

/**
 * Converts a parsed TLE entry into a Satellite model using SGP4 propagation.
 * Propagates to current UTC time to get live ECI position and velocity.
 *
 * @param entry   Parsed TLE entry
 * @param category Object category for visualization coloring
 * @returns Satellite model or null if propagation fails
 */
function tleToSatellite(entry: TLEEntry, category: string): Satellite | null {
    try {
        const satrec = satellite.twoline2satrec(entry.line1, entry.line2);

        if (satrec.error !== 0) return null;

        const now = new Date();
        const pv  = satellite.propagate(satrec, now);

        if (!pv.position || !pv.velocity) return null;

        const pos = pv.position as { x: number; y: number; z: number };
        const vel = pv.velocity as { x: number; y: number; z: number };

        // SGP4 returns km and km/s — convert to meters and m/s
        return {
            id:       `tle-${satrec.satnum}`,
            name:     entry.name,
            noradId:  parseInt(satrec.satnum, 10),
            category: category as 'satellite' | 'debris' | 'rocket-body',
            state: {
                position: [pos.x * 1000, pos.y * 1000, pos.z * 1000], // km → m
                velocity: [vel.x * 1000, vel.y * 1000, vel.z * 1000], // km/s → m/s
                epoch:    0,
            },
            forces: [],
        };
    } catch {
        return null;
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads real satellite catalog from Celestrak TLE data.
 * Fetches multiple groups, parses TLE entries, converts to Satellite models.
 * Uses localStorage cache to respect Celestrak's one-download-per-update policy.
 *
 * @param onProgress Optional callback fired after each group loads
 * @returns Array of Satellite models ready for SimulationEngine
 */
export async function loadTLESatellites(
    onProgress?: (loaded: number, total: number) => void
): Promise<Satellite[]> {
    const satellites: Satellite[] = [];
    const total = TLE_GROUPS.length;

    for (let i = 0; i < TLE_GROUPS.length; i++) {
        const { group, count, category } = TLE_GROUPS[i];

        try {
            const raw     = await fetchTLEGroup(group);
            const entries = parseTLEText(raw).slice(0, count);

            for (const entry of entries) {
                const sat = tleToSatellite(entry, category);
                if (sat) satellites.push(sat);
            }

            onProgress?.(i + 1, total);
        } catch (err) {
            console.error(`Failed to load TLE group "${group}":`, err);
            // Continue with other groups — partial data is better than nothing
        }
    }

    console.log(`TLE load complete: ${satellites.length} satellites`);
    return satellites;
}