import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

async function importForestsWithActiveCountries(activeCountries) {
  const previousValue = process.env.ACTIVE_COUNTRIES;
  if (activeCountries === undefined) {
    delete process.env.ACTIVE_COUNTRIES;
  } else {
    process.env.ACTIVE_COUNTRIES = activeCountries;
  }

  const cacheKey = `${activeCountries ?? 'default'}-${Date.now()}-${Math.random()}`;
  const module = await import(`../src/data/forests.js?scope=${encodeURIComponent(cacheKey)}`);

  if (previousValue === undefined) {
    delete process.env.ACTIVE_COUNTRIES;
  } else {
    process.env.ACTIVE_COUNTRIES = previousValue;
  }

  return module;
}

describe('active forest scope', () => {
  it('defaults to Jordan forests only', async () => {
    const { getActiveForests } = await importForestsWithActiveCountries(undefined);
    const forests = getActiveForests();

    assert.strictEqual(forests.length, 8);
    assert.ok(forests.every(forest => forest.country === 'JO'));
  });

  it('returns Jordan only from getAllCountries by default', async () => {
    const { getAllCountries } = await importForestsWithActiveCountries(undefined);
    const countries = getAllCountries();

    assert.deepStrictEqual(countries.map(country => country.code), ['JO']);
    assert.strictEqual(countries[0].forestCount, 8);
  });

  it('validates coordinates against the active Jordan country scope', async () => {
    const { isWithinAnyCountry } = await importForestsWithActiveCountries(undefined);

    assert.deepStrictEqual(isWithinAnyCountry(31.9539, 35.9106), { valid: true, country: 'JO' });
    assert.deepStrictEqual(isWithinAnyCountry(33.8938, 35.5018), { valid: false, country: null });
  });

  it('restores all countries when ACTIVE_COUNTRIES=*', async () => {
    const {
      FORESTS,
      getActiveForests,
      getAllCountries,
      isWithinAnyCountry,
    } = await importForestsWithActiveCountries('*');

    assert.strictEqual(getActiveForests().length, FORESTS.length);
    assert.ok(getAllCountries().length > 1);
    assert.deepStrictEqual(isWithinAnyCountry(33.8938, 35.5018), { valid: true, country: 'LB' });
  });
});
