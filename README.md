# Program Chair Analytics and Decision-Support Dashboard

A frontend-only React + Vite dashboard for the BAT 405 academic project at Batangas State University. All records are synthetic local samples; there is no backend, database, login or live Portal/SETE integration. The research model and benchmarks remain subject to validation.

## Features

- One-page Overview: alert strip, five KPI cards, three charts and a review list, printable on long bond paper
- Detail sections below it: Course Outcomes, Retention, Teaching Evaluation and Records, reached from the top navigation
- Department, batch, term and status filters, click-to-focus cross-filtering and a one-page Decision brief
- Sticky top navigation with a back-to-top button, responsive pages, keyboard controls and reduced-motion support
- Browser-tab filter persistence

## Run locally

Requires Node.js 24.x and npm. No environment variables or secrets are required.

```bash
git clone https://github.com/niks0501/bat405-program-chair-dashboard.git
cd bat405-program-chair-dashboard
npm ci
npm run dev
```

Open the local URL printed by Vite.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create the static production files in `dist/` |
| `npm run preview` | Preview the production build locally |

## Source structure

- `src/pages/`: the Overview dashboard and four detail sections
- `src/components/`: top navigation, decision brief, dropdowns, charts, tables and tooltips
- `src/data.js`: synthetic sample records and calculations
- `src/*.css`: shared theme, motion and page layouts
- `docs/dashboard-reference.md`: formulas, targets, thresholds, filters, charts and privacy notes (kept in sync with the code, see `AGENTS.md`)

React renders charts using SVG. There are no external data APIs. An optional Google Fonts stylesheet falls back to system fonts when unavailable.

## Data limitations

Targets: course pass rate 85%, retention 90%, grade submission 100%, SETE effectiveness 80%, and participation 70%. Current institutional rules and the official SETE formula must be verified before real use. Section scores with fewer than 10 valid responses are suppressed. These sample indicators must not be used for automatic instructor rankings or personnel decisions.

## Team

| Name | Role |
| --- | --- |
| niks0501 | Dev |
| PierreEdriz | Dev |

## License

[MIT](LICENSE).
