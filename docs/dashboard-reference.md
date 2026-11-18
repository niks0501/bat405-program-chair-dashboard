# Dashboard reference

How the DeciSETE dashboard (BSIT Program Chair analytics) computes what it shows. The dashboard itself does not explain its numbers, so this file is the single place to look. **Keep it in sync with the code** (see `AGENTS.md`).

Source of truth in code: `src/data.js` (records, formulas, `kpiGuide`), `src/pages/Overview.jsx` (KPI cards, charts, alerts), `src/components/DecisionBrief.jsx` (brief text).

## 1. Audience and purpose

- **Primary user:** Program Chair (tactical dashboard: department/program performance over medium-term periods).
- **Purpose:** monitor program outcomes against targets, spot what is off target, and decide what to follow up. Every KPI is tied to an objective, a target, a data source and a management action.
- **Layout:** the Overview block is the one-page dashboard (alert strip, five KPI cards, three charts, "Needs your attention" list). Courses, Retention, Teaching and Records are detail sections below it, reached from the top navigation or by clicking a card/bar.

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

The alert strip counts KPIs with `V < T` and names the largest gap. Percentage-point changes compare the same KPI across adjacent terms.

## 4. Filters and scope

| Filter | Applies to |
|---|---|
| Academic year, Semester | Every section (selects the reporting term) |
| Batch | Course outcomes and retention. Batch = students who entered the program in the same year (e.g. Batch 2024). A course is included when its year level matches `academic year - batch + 1`. Grade submission and SETE are program-wide |
| Department | Course outcomes, grade submission, SETE sections and the Teaching results. Retention is program-wide (tagged "Program-wide, not affected by Department" in its section). Departments in the sample data: Information Technology (IT 212, 311, 312, 313, 411, 412), Computer Science (IT 111, 112, 211) |
| Status | Filters displayed indicators and records by their own target. Summary totals and trend charts keep full scope |
| Focus (click a course bar / batch) | Course outcomes inspector, Retention spotlight and Records follow the focused course or batch. Chips in the filter bar clear it. Reset clears everything |

Grade submission by department: expected sets are split by the department's share of courses; missed sets are split 2/3 Computer Science, 1/3 Information Technology (rounded up for Computer Science).

## 5. Charts

| Chart | Computation |
|---|---|
| Course performance (bars) | Pass rate per course = passed / attempts x 100, sorted lowest first. Marker at 85% |
| Student retention (line) | Per term: sum(enrolled) / sum(eligible) over batches matching the filters. Y axis starts at 80% (a truncated axis, acceptable for a line chart). Target line at 90% |
| SETE effectiveness (line) | Per term: response-weighted score (KPI 4). Y axis 70-90%. Target line at 80%. The Teaching section's score view uses the same 70-90% axis; its participation view uses 50-100% with a 70% target |
| KPI card sparkline | The KPI's value for each of the six terms; the dot marks the selected term |

The scope chips in the Teaching, Retention and Records sections show what the filters currently cover (for example "Computer Science · SETE", or "Batch 2024 · All departments" on Records).

Clicking a point or term button on a line chart changes the selected academic year and semester for the whole page.

## 6. Decision brief

Opened from the filter bar. Built from the current Academic year, Semester, Batch and Department (the Status filter is ignored so the brief covers all KPIs). Sections: Purpose, Scope, Key findings, Evidence, Interpretation, Decision implications, Limitations.
- Key findings: indicators on track, the largest gap, courses below 85% (lowest three), batches below 90% (lowest three).
- Decision implications: one action per off-target KPI taken from section 2, plus the specific courses/batches to start with.
- Limitations include participation, suppressed sections, missing batch data, and that the SETE formula and benchmarks need institutional verification.
- Print or save as PDF, or copy as text.

## 7. Printing

Enlarge: each of the three Overview charts (Course performance, Student retention, SETE effectiveness) has an enlarge button that opens the same content in a larger modal (Escape, the close button or a click outside closes it). It shows the same data, filters and term selection; nothing is recomputed. The modal is not printed.

Overview text is kept minimal. On KPI cards, the management action is shown only for Watch and At risk indicators (it is always listed in section 2 and in the Decision brief). Chart legends, formula footnotes and instructional captions are intentionally not shown in the UI.

Branding: the product is named DeciSETE (logo `public/decisete-logo.png`; favicon and apple-touch icon are resized copies of it). The page heading "BSIT Program Dashboard" names the program reported on. The browser title is "DeciSETE | Program Dashboard" and the Decision brief eyebrow reads "DECISETE · DECISION BRIEF".

"Print dashboard" prints the Overview block on one colored long bond page (13 x 8.5 in, landscape): header with scope, alert strip, five KPI cards, three charts. Detail sections, the filter bar and the attention list are hidden in print. The Decision brief prints separately as a portrait 8.5 x 13 in document.

## 8. Privacy and access

- Results are aggregated by course section. No student or instructor identities appear.
- SETE scores for sections with fewer than 10 valid responses are suppressed ("Suppressed") and count as no data.
- CSV exports contain only the displayed aggregates, following the active category, filters, search and sort.
- Do not use these indicators for automatic instructor rankings or personnel decisions.
- A production system should add role-based access: Program Chair sees program-level results, instructors see only their own sections, the Dean sees the college roll-up.
- The app has no backend, login or database. Filters persist only in the current browser tab (sessionStorage).

## 9. Data source and limitations

- All records are generated local sample aggregates in `src/data.js`. There is no connection to the Student and Faculty Portal or SETE.
- Some early terms have no eligible continuing population for newer batches, so retention shows no data there. Batch-to-year assignment is simplified.
- The official SETE instrument, conversion and aggregation rules, and institutional benchmarks are not verified.
- One term of change is not enough to establish a reliable trend.
