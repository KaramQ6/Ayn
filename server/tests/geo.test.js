import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDistanceKm } from '../src/utils/geo.js';

describe('getDistanceKm', () => {
  it('returns 0 for the same point', () => {
    const d = getDistanceKm(31.5, 36.0, 31.5, 36.0);
    assert.strictEqual(d, 0);
  });

  it('computes ~111 km for 1 degree latitude difference on equator', () => {
    const d = getDistanceKm(0, 0, 1, 0);
    assert.ok(d > 110 && d < 112, `Expected ~111 km, got ${d}`);
  });

  it('computes correct distance between Amman and Ajloun (~70 km)', () => {
    // Amman: 31.9539, 35.9106  |  Ajloun: 32.3326, 35.7516
    const d = getDistanceKm(31.9539, 35.9106, 32.3326, 35.7516);
    assert.ok(d > 40 && d < 80, `Expected ~45-75 km, got ${d}`);
  });

  it('is symmetric', () => {
    const d1 = getDistanceKm(31.5, 36.0, 32.0, 36.5);
    const d2 = getDistanceKm(32.0, 36.5, 31.5, 36.0);
    assert.ok(Math.abs(d1 - d2) < 0.001, `d1=${d1}, d2=${d2}`);
  });

  it('handles negative coordinates', () => {
    const d = getDistanceKm(-33.8688, 151.2093, -37.8136, 144.9631);
    assert.ok(d > 700 && d < 800, `Sydney-Melbourne ~714 km, got ${d}`);
  });
});
