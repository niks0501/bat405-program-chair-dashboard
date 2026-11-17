import assert from 'node:assert/strict';
import test from 'node:test';
import { dataset, departments, kpiGuide, matchesStatus } from './data.js';

const baseline = dataset('2025', '2', 'all', 'all');
const almostEqual = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to equal ${expected}`);

test('the overview exposes exactly five documented KPIs in order', () => {
  assert.deepEqual(baseline.metrics.map(metric => metric.key), [
    'pass', 'retention', 'grades', 'teaching', 'response',
  ]);
  assert.deepEqual(baseline.metrics.map(metric => metric.target), [85, 90, 100, 80, 70]);
  for (const metric of baseline.metrics) {
    assert.equal(metric.decision, kpiGuide[metric.key].decision);
    assert.equal(metric.period, kpiGuide[metric.key].period);
  }
});

test('KPI values use their corresponding underlying counts', () => {
  const values = Object.fromEntries(baseline.metrics.map(metric => [metric.key, metric.value]));
  almostEqual(values.pass, baseline.passed / baseline.attempts * 100);
  almostEqual(values.retention, baseline.enrolled / baseline.eligible * 100);
  almostEqual(values.grades, baseline.submitted / baseline.expected * 100);
  almostEqual(values.response, baseline.valid / baseline.evaluations * 100);
  const weightedScore = baseline.sections.reduce(
    (total, section) => total + section.valid * section.score, 0,
  ) / baseline.valid;
  almostEqual(values.teaching, weightedScore);
});

test('all supported academic terms produce finite percentage indicators', () => {
  for (const year of ['2023', '2024', '2025']) {
    for (const semester of ['1', '2']) {
      const result = dataset(year, semester, 'all', 'all');
      assert.equal(result.metrics.length, 5);
      for (const metric of result.metrics) {
        assert.ok(metric.value === null ||
          (Number.isFinite(metric.value) && metric.value >= 0 && metric.value <= 100),
        `Unexpected ${metric.key} for ${year} semester ${semester}: ${metric.value}`);
      }
    }
  }
});

test('department and batch filters scope course records', () => {
  for (const department of departments) {
    const result = dataset('2025', '2', 'all', department);
    assert.ok(result.rows.length > 0);
    assert.ok(result.rows.every(row => row.dept === department));
  }
  const firstYear = dataset('2025', '2', '2025', 'all');
  assert.ok(firstYear.rows.length > 0);
  assert.ok(firstYear.rows.every(row => row.year === 1));
});

test('status boundaries classify a result relative to its target', () => {
  assert.equal(matchesStatus(85, 85, 'on-track'), true);
  assert.equal(matchesStatus(84.9, 85, 'watch'), true);
  assert.equal(matchesStatus(80, 85, 'watch'), true);
  assert.equal(matchesStatus(79.9, 85, 'at-risk'), true);
  assert.equal(matchesStatus(null, 85, 'at-risk'), false);
  assert.equal(matchesStatus(null, 85, 'all'), true);
});
