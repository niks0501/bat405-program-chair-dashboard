# AGENTS.md

Guidance for AI coding agents working in this repository. `CLAUDE.md` is a symlink to this file.

## Project

DeciSETE (formerly BSIT Insights): a frontend-only React 19 + Vite dashboard for the BAT 405 project (Program Chair analytics and decision support, Batangas State University). No backend, no tests framework, no environment variables.

```bash
npm ci            # install
npm run dev       # dev server (vite --host 127.0.0.1)
npm run build     # production build, must pass before committing
```

## Layout

- `src/App.jsx`: filters, focus (cross-filter) state, single-page sections, decision brief wiring.
- `src/data.js`: sample records, `dataset()` calculations, `kpiGuide` (objective, target, data, management action, review period).
- `src/pages/`: Overview (the one-page dashboard), Courses, Retention, Teaching, Records.
- `src/components/`: top nav + scroll-top (`Sidebar.jsx`), `DecisionBrief.jsx`, charts/cards (`UI.jsx`), dropdown, tooltip.
- `src/refinements.css`: latest layout, print and component overrides. Other CSS files are loaded in the order listed in `src/main.jsx`.
- `docs/dashboard-reference.md`: how every number is computed. See below.

## Keep docs in sync (required)

The dashboard has no "data notes" page. Formulas, targets, thresholds, filter scope, chart computation, privacy behavior and limitations live in `docs/dashboard-reference.md`.

**Whenever a change touches any of the following, update `docs/dashboard-reference.md` in the same change:**
- KPI definitions, formulas, targets, objectives, management actions or review periods (`kpiGuide`, `dataset()`).
- Status or warning thresholds, or alert logic.
- Filters, their scope, or focus/cross-filter behavior.
- Chart contents, axes or computations.
- Decision brief content or logic.
- Print layout.
- Privacy, suppression or export behavior; sample-data assumptions.

Do not put formula or methodology explanations back into the UI. Update `README.md` when features or structure change.

## Conventions

- Dashboard design rules (from the BAT 405 case study and reviewers): exactly **five KPI cards** on the Overview; three main visualizations; at least two interactive features; a warning/alert mechanism; critical items first; every KPI ties to a target and a management action; SETE is never the sole measure of teaching effectiveness and is never used to rank instructors.
- The detail sections must not add more KPI-style card rows.
- User-facing wording says **batch**, not "cohort" (internal identifiers such as `cohort` keys may stay).
- Text sizes: nothing smaller than 11px. Keep the hierarchy (labels < body < values < headings).
- Navigation scrolls to sections on one page; it never swaps views.
- Verify UI changes in a browser (Playwright is available) at 1440px and 390px with no horizontal overflow and no console errors.
- Commit messages: short imperative summary. Do not commit `dist/` or `node_modules/`.
