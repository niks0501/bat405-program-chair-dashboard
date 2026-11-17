# Program Chair Analytics and Decision-Support Dashboard

A frontend-only React + Vite dashboard for the BAT 405 academic project at Batangas State University. All records are synthetic local samples; there is no backend, database, login or live Portal/SETE integration. The research model and benchmarks remain subject to validation.

## Features

- Overview with KPI trends and review priorities
- Course Outcomes with search, sorting and course details
- Retention trends and batch spotlight
- Teaching Evaluation with score and participation views
- Records with filtered CSV downloads
- Data Notes with definitions, targets and limitations
- Fixed red sidebar, responsive pages, keyboard controls and reduced-motion support
- Browser-tab filter persistence

## Run locally

Requires Node.js 22 or newer and npm. No environment variables or secrets are required.

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

- `src/pages/`: the six dashboard pages
- `src/components/`: sidebar, dropdowns, charts, tables and tooltips
- `src/data.js`: synthetic sample records and calculations
- `src/*.css`: shared theme, motion and page layouts

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
