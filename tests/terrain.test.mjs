import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = name => JSON.parse(readFileSync(new URL('../public/data/' + name, import.meta.url), 'utf8'));
const terrain = load('terrain.json');
const validation = load('validation.json');

test('3D Decarbonization Response Surface grids have complete 25x25 numeric coverage', () => {
  for (const key of ['local', 'regional']) {
    const g = terrain[key];
    assert.equal(g.x.length, 25);
    assert.equal(g.y.length, 25);
    assert.equal(g.z.length, 25);
    assert.ok(g.z.every(row => row.length === 25));
    const cells = g.z.flat();
    assert.ok(cells.every(z => Number.isFinite(z)));
    assert.ok(Math.abs(Math.min(...cells) - g.min) < 0.01);
    assert.ok(Math.abs(Math.max(...cells) - g.max) < 0.01);
  }
  assert.deepEqual(terrain.local.bounds, [40, 40, 120, 120]);
});

test('Published validation manifest confirms zero failures', () => {
  assert.equal(validation.checks, validation.passed);
  assert.deepEqual(validation.failures, []);
  assert.equal(validation.inventorySourcesCount, 16);
  assert.equal(validation.inBoundarySourcesCount, 14);
  assert.equal(validation.outOfBoundarySourcesCount, 2);
  assert.equal(validation.initiativesCount, 13);
});
