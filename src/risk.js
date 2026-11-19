// At-risk student model, as integrated into DeciSETE.
// The parameters below are the fitted pipeline from the BAT 405 Part IV run
// (run_2026-11-19_01-24-26): median imputation -> standardization -> logistic regression.
// Inference runs here in the browser, so every score on the dashboard is computed by the model.
// The model is static: it was trained once on synthetic data and is not retrained by the dashboard.

export const MODEL = {
  name: 'At-risk student model',
  type: 'Logistic regression',
  version: 'Run 2026-11-19',
  threshold: 0.2,
  highThreshold: 0.5,
  intercept: -1.775565,
  features: [
    { key: 'year_level', median: 2, mean: 2.416571, scale: 1.105782, coef: -0.001847 },
    { key: 'prev_gwa', median: 2.015, mean: 2.011466, scale: 0.468393, coef: 1.407693 },
    { key: 'failed_inc_subjects', median: 0, mean: 0.487, scale: 0.735898, coef: 1.075781 },
    { key: 'units_enrolled', median: 18, mean: 18.940714, scale: 2.721512, coef: 0.408696 },
    { key: 'repeated_subjects', median: 0, mean: 0.296, scale: 0.548594, coef: 0.483442 },
  ],
};

// Student-level factors the Program Chair can act on, with the support each one suggests.
export const factors = {
  prev_gwa: { label: 'Previous GWA', short: 'Low previous grades', phrase: 'low previous grades', action: 'Refer to academic advising and tutoring.' },
  failed_inc_subjects: { label: 'Failed or INC subjects', short: 'Failed or INC subjects', phrase: 'failed or INC subjects', action: 'Agree on a plan to complete INC and failed subjects.' },
  repeated_subjects: { label: 'Repeated subjects', short: 'Repeated subjects', phrase: 'repeated subjects', action: 'Review the retake schedule with the adviser.' },
  units_enrolled: { label: 'Units enrolled', short: 'Heavy unit load', phrase: 'a heavy unit load', action: 'Review the study load with the adviser.' },
};
const actionable = ['prev_gwa', 'failed_inc_subjects', 'repeated_subjects', 'units_enrolled'];

const sigmoid = x => 1 / (1 + Math.exp(-x));

// Missing values are replaced by the training median, exactly like the fitted pipeline.
export function scoreStudent(input) {
  let logit = MODEL.intercept;
  const contributions = {};
  for (const f of MODEL.features) {
    const raw = input[f.key];
    const value = raw == null || Number.isNaN(raw) ? f.median : raw;
    const part = f.coef * (value - f.mean) / f.scale;
    contributions[f.key] = part;
    logit += part;
  }
  return { score: sigmoid(logit), contributions };
}

export const levelOf = score => (score >= MODEL.highThreshold ? 'High' : score >= MODEL.threshold ? 'Elevated' : 'Low');

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Enrolled students who continued into the current term, by batch (same counts as the Retention view).
const batches = [['2022', 101], ['2023', 117], ['2024', 106], ['2025', 128]];

function buildRoster() {
  const rand = rng(2026);
  const poisson = mean => { let l = Math.exp(-mean), k = 0, p = 1; do { k++; p *= rand(); } while (p > l); return k - 1; };
  const roster = [];
  for (const [batch, count] of batches) {
    const year = Math.min(4, 2025 - Number(batch) + 1);
    for (let i = 0; i < count; i++) {
      const strain = normal(rand);
      const gwa = clamp(1.92 + 0.3 * strain + 0.14 * normal(rand), 1.0, 3.0);
      const failed = Math.min(5, poisson(Math.max(0.04, 0.3 + 0.22 * strain + (gwa - 2) * 0.35)));
      const repeated = Math.min(4, poisson(Math.max(0.03, 0.18 + 0.08 * strain + failed * 0.14)));
      const units = clamp(Math.round(19 + normal(rand) * 2.4 + repeated * 0.8), 12, 27);
      const dept = rand() < 0.62 ? 'Information Technology' : 'Computer Science';
      const input = { year_level: year, prev_gwa: Number(gwa.toFixed(2)), failed_inc_subjects: failed, units_enrolled: units, repeated_subjects: repeated };
      const { score, contributions } = scoreStudent(input);
      const drivers = actionable
        .map(key => ({ key, part: contributions[key] }))
        .filter(d => d.part > 0.12)
        .sort((a, b) => b.part - a.part)
        .slice(0, 3)
        .map(d => d.key);
      roster.push({
        id: `S-${batch}-${String(1000 + Math.floor(rand() * 8999))}`,
        batch, year, dept, ...input, score, level: levelOf(score), drivers,
      });
    }
  }
  // Anonymous sample IDs must be unique.
  const seen = new Set();
  for (const s of roster) { while (seen.has(s.id)) s.id = `S-${s.batch}-${Number(s.id.slice(-4)) % 9000 + 1000 + 1}`; seen.add(s.id); }
  return roster;
}

export const roster = buildRoster();
export const scoredTerm = '25–26 · 2nd';

export function valueText(student, key) {
  const v = student[key];
  if (key === 'prev_gwa') return `Previous GWA ${v.toFixed(2)}`;
  if (key === 'failed_inc_subjects') return `${v} failed or INC subject${v === 1 ? '' : 's'}`;
  if (key === 'repeated_subjects') return `${v} repeated subject${v === 1 ? '' : 's'}`;
  return `${v} units enrolled`;
}

export function supportFor(student) {
  const first = student.drivers[0];
  return first ? factors[first].action : 'Check in with the adviser.';
}

// Students flagged by the model for the selected batch and department filters.
export function riskView({ cohort = 'all', dept = 'all', batch = null } = {}) {
  const scope = roster.filter(s => (cohort === 'all' || s.batch === cohort) && (dept === 'all' || s.dept === dept) && (!batch || s.batch === batch));
  const flagged = scope.filter(s => s.score >= MODEL.threshold).sort((a, b) => b.score - a.score);
  const high = flagged.filter(s => s.level === 'High');
  const byBatch = batches.map(([b]) => {
    const all = scope.filter(s => s.batch === b);
    const f = all.filter(s => s.score >= MODEL.threshold);
    return { batch: b, total: all.length, flagged: f.length, high: f.filter(s => s.level === 'High').length };
  }).filter(r => r.total > 0);
  const byFactor = actionable.map(key => ({ key, label: factors[key].short, count: flagged.filter(s => s.drivers[0] === key).length, any: flagged.filter(s => s.drivers.includes(key)).length }))
    .sort((a, b) => b.count - a.count);
  return { scope, flagged, high, byBatch, byFactor };
}

export function riskLine(view) {
  if (!view.scope.length) return null;
  const top = view.byBatch.slice().sort((a, b) => b.flagged - a.flagged)[0];
  const factor = view.byFactor[0];
  return {
    flagged: view.flagged.length,
    total: view.scope.length,
    high: view.high.length,
    topBatch: top && top.flagged ? top : null,
    topFactor: factor && factor.count ? factor : null,
  };
}
