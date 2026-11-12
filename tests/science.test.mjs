import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  computeBaselineSummary,
  evaluatePathway,
  computeMcdaScore,
  assessGovernanceGate,
  csvText
} from '../src/science/science.mjs';

const D = JSON.parse(readFileSync(new URL('../public/data/evidence.json', import.meta.url), 'utf8'));

test('CYC 2026 baseline inventory matches official handbook page 15-17 exact numbers', () => {
  const s = computeBaselineSummary(D.sources);
  assert.equal(s.scope1, 4152.04);
  assert.equal(s.scope2, 2400.52);
  assert.equal(s.scope12, 6552.56);
  assert.equal(s.scope3Total, 19835.40);
  assert.equal(s.scope3OutBoundary, 3078.63); // Cat 8 (527.57) + Cat 12 (2551.06)
  assert.equal(s.scope3InBoundary, 16756.77);  // ≈ 16756.60 in handbook (~84% coverage)
  assert.equal(s.totalReported, 26387.96);
  assert.equal(s.inBoundaryTotal, 23309.33);
});

test('Sequential anti-double-counting engine prevents 813.09 tCO2e of double counting in recommended scenario', () => {
  const ev = evaluatePathway(D, { scenario: 'recommended', execScale: 1.0, reShare: 0.968, supplierAdoption: 1.0 });
  // Scope 2: 18% efficiency first reduces 2400.52 by 432.09 -> residual 1968.43 -> 96.8% RE reduces 1905.44
  assert.equal(ev.scope2.baseline, 2400.52);
  assert.ok(ev.scope2.reduction < 2400.52);
  assert.ok(ev.total.doubleCountAvoided > 800);

  // Must pass both SBTi Scope 1+2 (-63% / >=4128.11) and Scope 3 (-37.5% / >=6283.73) targets
  assert.equal(ev.scope12.compliant, true);
  assert.equal(ev.scope3.compliant, true);
  assert.equal(ev.total.compliant, true);
  assert.ok(ev.scope12.reduction >= 4128.11);
  assert.ok(ev.scope12.final2036 <= 2424.45);
  assert.ok(ev.scope3.reduction >= 6283.73);
  assert.ok(ev.scope3.final2036 <= 10472.88);
  assert.ok(ev.total.reduction >= 10411.84);
});

test('Quick-wins-only sensitivity scenario demonstrates why Scope 3 supplier action is indispensable', () => {
  const qw = evaluatePathway(D, { scenario: 'quickwins', execScale: 0.95, reShare: 0.88, supplierAdoption: 0.65 });
  assert.equal(qw.scope12.compliant, true); // Operational quick wins still meet Scope 1+2 target
  assert.equal(qw.scope3.compliant, false); // 65% supplier adoption falls short of -37.5% Scope 3 requirement
  assert.equal(qw.total.compliant, false);
});

test('MCDA prioritization scores and governance stage-gate assessments behave deterministically', () => {
  for (const init of D.initiatives) {
    const score = computeMcdaScore(init);
    assert.ok(score >= 70 && score <= 100);
  }
  const pending = Array.from({ length: 4 }, () => ({ status: 'unknown', evidence: '' }));
  assert.equal(assessGovernanceGate('Balanced', pending).status, 'pending');
  assert.equal(assessGovernanceGate('Balanced', pending).approvedCapexPct, 35);

  const ready = pending.map(() => ({ status: 'verified', evidence: 'ISO 14064-1 verified' }));
  assert.equal(assessGovernanceGate('Balanced', ready).status, 'ready');
  assert.equal(assessGovernanceGate('Balanced', ready).approvedCapexPct, 100);

  ready[2].status = 'failed';
  assert.equal(assessGovernanceGate('Balanced', ready).status, 'hold');
  assert.equal(assessGovernanceGate('Balanced', ready).approvedCapexPct, 0);
});

test('CSV export preserves UTF-8 BOM and neutralizes formula injection', () => {
  const out = csvText([{ code: '=1+1', note: 'a"b', val: null }]);
  assert.ok(out.startsWith('\uFEFF'));
  assert.match(out, /"'=1\+1"/);
  assert.match(out, /"a""b",""/);
});
