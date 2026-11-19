# Dashboard reference

How the DeciSETE dashboard (BSIT Program Chair analytics) computes what it shows. The dashboard itself does not explain its numbers, so this file is the single place to look. **Keep it in sync with the code** (see `AGENTS.md`).

Source of truth in code: `src/data.js` (records, formulas, `kpiGuide`), `src/pages/Overview.jsx` (KPI cards, alerts), `src/components/DecisionBrief.jsx` (brief text).

## 1. Audience and purpose

- **Primary user:** Program Chair (tactical dashboard: department/program performance over medium-term periods).
- **Purpose:** monitor program outcomes against targets, spot what is off target, and decide what to follow up. Every KPI is tied to an objective, a target, a data source and a management action.
- **Layout:** the Overview block is the one-page dashboard (order: "Program status" heading, alert strip, the "Review first" list, one ruled row of the five KPIs, then the three chart cards). Courses, Retention, Teaching and Records are detail sections below it, reached from the top navigation or by clicking a card/bar.

## 2. KPIs

Five KPI cards. Academic operations: 1-3. Teaching effectiveness: 4-5.

| # | KPI | Objective | Formula | Target | Management action | Data source | Review |
|---|---|---|---|---|---|---|---|
| 1 | Course pass rate | Students pass the courses they attempt | passed finalized attempts / finalized attempts x 100 | 85% | Review below-target courses with their course teams and plan academic support | Finalized grades per course | Every semester |
| 2 | Student retention | Students continue into the next term | continuing enrolled students / eligible prior-term students x 100 | 90% | Ask advisers to look into batches below target and find what keeps students from continuing | Eligible prior-term students and re-enrollment | Every semester |
| 3 | Grade submission | Grades are submitted on time | on-time grade sets / expected grade sets x 100 | 100% | Follow up late grade submissions with the instructors concerned | Expected and on-time grade sets | Each grading period |
| 4 | SETE effectiveness | Teaching is evaluated as effective | sum(section score x valid responses) / sum(valid responses) | 80% | Discuss low-scoring sections with their instructors; do not use scores to rank instructors | SETE section scores and valid responses | Every semester |
| 5 | SETE response | Enough students complete the evaluation | valid completed evaluations / eligible evaluations x 100 | 70% | Raise participation before relying on SETE scores | Valid responses and eligible evaluations | Each evaluation period |

Notes:
- An *attempt* is a course registration with a finalized grade, not a unique student.
- Continuation does not explain *why* students did not continue.
- SETE effectiveness is response-weighted. It is not a sole measure of teaching effectiveness.
- Percentages are computed from displayed counts and rounded to one decimal. Weighted rates use total counts, not an average of percentages.

## 3. Status and warning thresholds

For a KPI with target `T` and value `V`:

| Status | Rule | Intervention |
|---|---|---|
| On track | `V >= T` | None |
| Watch | `T - 5 <= V < T` (0.1-5.0 pts below) | Monitor next term |
| At risk | `V < T - 5` (more than 5.0 pts below) | Program Chair meets the responsible party and sets a follow-up |
| No data | no eligible population, unavailable term, or suppressed score | Not evaluated |

Additional warning: **SETE response under 70%** means SETE scores are indicative only. Raise participation first. A Teaching banner repeats this when participation is below 70%.

The alert strip reads "N of 5 indicators below target" (KPIs with `V < T`, same count as the "on track" pill: 5 minus on-track), then adds the number of courses under the 85% pass target and the number of students flagged by the risk model when they apply. These are separate counts: the "Review first" list can show more rows than the KPI count because it also lists the flagged-student row and the course row. Percentage-point changes compare the same KPI across adjacent terms.

## 4. Filters and scope

On screens 760px wide or narrower the filter panel is collapsed behind a "Filters" button (with a count of changed filters); the active filter chips stay visible.

| Filter | Applies to |
|---|---|
| Academic year, Semester | Every section (selects the reporting term) |
| Batch | Course outcomes and retention. Batch = students who entered the program in the same year (e.g. Batch 2024). A course is included when its year level matches `academic year - batch + 1`. Grade submission and SETE are program-wide |
| Department | Course outcomes, grade submission, SETE sections and the Teaching results. Retention is program-wide (tagged "Program-wide, not affected by Department" in its section). Departments in the sample data: Information Technology (IT 212, 311, 312, 313, 411, 412), Computer Science (IT 111, 112, 211) |
| Status | Filters displayed indicators and records by their own target. Summary totals and trend charts keep full scope |
| Focus (click a course bar / batch) | Course outcomes inspector, Retention spotlight and Records follow the focused course or batch. Chips in the filter bar clear it. Reset clears everything |

Grade submission by department: expected sets are split by the department's share of courses; missed sets are split 2/3 Computer Science, 1/3 Information Technology (rounded up for Computer Science).

## 5. Charts

The dashboard has three charts. Each appears twice: as a compact version in the one-page Overview (so the one-page dashboard contains all three visualizations) and as the full version in its detail section (Course outcomes, Retention, Teaching evaluation). Both versions use the same data and the same filters.

| Chart | Computation |
|---|---|
| Course outcomes (bars, Course outcomes section; Overview shows all courses, lowest first, filling the card height) | Pass rate per course = passed / attempts x 100, sorted lowest first. Marker at 85%. On the Overview, clicking a bar sets the course focus (cross-filter) |
| Retention (line, Retention section) | Default: one program-wide line. Per term: sum(enrolled) / sum(eligible) over batches matching the Batch and Department filters. The "Compare batches" toggle replaces it with one line per batch. Y axis starts at 80% (a truncated axis, acceptable for a line chart). Target line at 90% |
| SETE score (line, Teaching evaluation section) | Per term: response-weighted score (KPI 4). Y axis 70-90%. Target line at 80%. The Overview versions of the retention and SETE lines are the program-wide series only (no Compare batches toggle, no term buttons); clicking a point still changes the term. Each Overview chart card has an Enlarge button that opens the chart in a floating modal (Escape, the close button or a click outside closes it): the course bars add full course names and the gap to target, and the two lines show the full chart with legend and term buttons. Participation is shown beside the score and in the sections table, not as a second chart |

KPI cards show the value, change vs the prior term, target and supporting counts only; they have no sparkline or progress bar. The Overview chart row is not a second row of KPI cards: each chart card repeats a headline value already shown in the five KPI cards.

### Chart colors

Blue is data, green/amber/red is status against target, gray is reference. The brand crimson stays in the navigation, buttons and badges and is not used for chart data. Tokens live in `src/refinements.css` (`--chart-*`); line series colors are in `Chart` in `src/components/UI.jsx`.

| Token | Hex | Use |
|---|---|---|
| `--chart-1` Blue | `#2b6cb0` | Main series, legend dots, focus accent |
| `--chart-2` Light blue | `#7fa8d4` | Second series |
| `--chart-3` Pale blue | `#a9c4e2` | Third series |
| `--chart-4` Slate blue | `#5b7392` | Fourth series |
| `--chart-ok` Green | `#2f855a` | At or above target |
| `--chart-watch` Amber | `#d69e2e` | Below target by up to 5 points |
| `--chart-risk` Red | `#b1263b` | More than 5 points below target |
| `--chart-grid` / `--chart-target` | `#e5e7eb` / `#9ca3af` | Gridlines / dashed target line |
| `--chart-band` | `#eef4fb` | Selected term band, focused or selected bar row |

Status colors use the same thresholds as the Status badges (on track >= target, watch within 5 points, at risk beyond). They apply to: course pass-rate bars (target 85%), the retention continuation bar (90%) in the batch spotlight. On line charts the line stays blue, and points below target change shape as well as color (circle on target, diamond for watch, triangle for at risk), so status never depends on color alone. Several series are also separated by dash style.

The scope chips in the Teaching, Retention and Records sections show what the filters currently cover (for example "Computer Science · SETE", or "Batch 2024 · All departments" on Records).

Clicking a point or term button on a line chart changes the selected academic year and semester for the whole page.

## 5a. At-risk students (risk model)

Section `#risk` (`src/pages/Risk.jsx`, model and sample roster in `src/risk.js`). It shows how the Part IV at-risk model supports the Program Chair's decisions. The model is static: it was trained once (run 2026-11-19, logistic regression on synthetic data) and the dashboard only applies it.

- Scoring: for each student, missing inputs are replaced by the training median, standardized with the training mean and scale, and passed through the fitted logistic regression (intercept and coefficients copied from the trained pipeline in `MODEL`). Features: year level, previous GWA, failed or INC subjects, units enrolled, repeated subjects. Score = estimated chance of falling behind.
- Flag thresholds: 20% or higher is flagged (the model's alert threshold); 50% or higher is High risk, 20-49% is Elevated.
- Main factors per student: the factors that push the score up most (coefficient x standardized value), up to three, among previous GWA, failed or INC subjects, repeated subjects and units enrolled. Each factor maps to a suggested support action.
- Scope: Batch and Department filters and the batch focus apply. Academic year, Semester and Status do not; scores always refer to the current term (25-26, 2nd semester). The roster covers continuing students per batch (same counts as Retention, 452 in total).
- Panels: flagged students by batch (select to focus a batch), main factor counts (select to filter the list), and the prioritized student list with search, risk level filter, sort and "show more".
- Support plan: rows can be added to a plan (stored in sessionStorage for the tab). "Export support plan" downloads the plan as CSV, or the current list when the plan is empty.
- Overview: "Review first" (previously "Needs your attention") lists the flagged-student count first when it applies (and the Status filter is All or At risk). It is not a KPI card.
- Decision brief: adds a key finding, a decision implication and a limitation about the flags.
- The sample roster is generated deterministically in `src/risk.js` (seeded). It is synthetic. Student IDs are anonymous sample IDs, not real student numbers.

## 6. Decision brief

Opened from the filter bar. Built from the current Academic year, Semester, Batch and Department (the Status filter is ignored so the brief covers all KPIs). Sections: Purpose, Scope, Key findings, Evidence, Interpretation, Decision implications, Limitations.
- Key findings: indicators on track, the largest gap, courses below 85% (lowest three), batches below 90% (lowest three), and the number of students flagged by the risk model (section 5a).
- Decision implications: one action per off-target KPI taken from section 2, plus the specific courses/batches to start with, and an at-risk students action when students are flagged.
- Limitations include participation, suppressed sections, missing batch data, and that the SETE formula and benchmarks need institutional verification.
- Print or save as PDF, or copy as text.

## 7. Printing

Overview text is kept minimal. KPI cards do not show the management action (it is listed in section 2 and in the Decision brief). Chart legends, formula footnotes and instructional captions are intentionally not shown in the UI.

Branding: the product is named DeciSETE (logo `public/decisete-logo.png`; the favicons are the mark only, with a transparent background and no white plate; the apple-touch icon is a resized copy of the logo). The page heading "BSIT Program Dashboard" names the program reported on. The browser title is "DeciSETE | Program Dashboard" and the Decision brief eyebrow reads "DECISETE · DECISION BRIEF".

"Print dashboard" prints the Overview block on one colored long bond page (13 x 8.5 in, landscape): header with scope, alert strip, the attention list, the five-KPI row and the three-chart row (shrunk to fit one page). Detail sections and the filter bar are hidden in print. The Decision brief prints separately as a portrait 8.5 x 13 in document.

## 8. Privacy and access

- Results are aggregated by course section. No instructor identities appear. The at-risk list shows anonymous synthetic sample IDs only; a real deployment would need data-privacy approval and role-based access to student-level risk scores.
- SETE scores for sections with fewer than 10 valid responses are suppressed ("Suppressed") and count as no data.
- CSV exports contain only the displayed records, following the active category, filters, search and sort. The support plan export contains anonymous sample IDs.
- Do not use these indicators for automatic instructor rankings or personnel decisions.
- A production system should add role-based access: Program Chair sees program-level results, instructors see only their own sections, the Dean sees the college roll-up.
- The app has no backend, login or database. Filters persist only in the current browser tab (sessionStorage).

## 9. Data source and limitations

- All records are generated local sample aggregates in `src/data.js`. There is no connection to the Student and Faculty Portal or SETE.
- Some early terms have no eligible continuing population for newer batches, so retention shows no data there. Batch-to-year assignment is simplified.
- The official SETE instrument, conversion and aggregation rules, and institutional benchmarks are not verified.
- One term of change is not enough to establish a reliable trend.
- Risk flags come from a model trained on synthetic data with labels from an assumed formula, so they are illustrative and not validated on real students.

## Visual conventions (de-AI pass)

- Type: IBM Plex Sans (Google Fonts, falls back to Arial), tabular figures everywhere. CSS sizes use one scale: 12, 14, 16, 20, 24, 32 and 40 px.
- Colour: one brand maroon for chrome and actions; a single status ramp (green on track, amber watch, red at risk). Chart lines are neutral ink, not a second brand colour; the Target label sits in the right margin so it never overlaps the data line.
- No accent bars: cards and alerts use full borders or tints, not one-sided stripes. Hover is a background tint, not a lift. The only scroll-triggered motion is the retention line draw.
- Reduced motion: animations stop; colour, border and opacity transitions stay so state changes remain visible.
- Section eyebrow labels were removed; headings carry the section.
