# CricSelect XAI — Dashboard Frontend

The React/Vite single-page application that turns the dissertation's forecasting, profiling, recommendation and optimisation pipeline into an interactive decision-support dashboard for the five leagues (IPL, PSL, BBL, CPL, T20 Blast). It is the presentation layer described in Chapters 3–4: every screen is a thin, stateless view over the Flask API in [`../backend`](../backend), which in turn serves the frozen artifacts produced by the notebooks in [`../Notebooks`](../Notebooks).

This frontend does not run any models, compute any statistics, or store any player data itself — it fetches JSON from the backend and renders it. That separation is deliberate: it keeps the analytical logic auditable in the notebooks and the API, and keeps the UI a straightforward, inspectable client on top of it.

## Contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [How the pieces fit together](#how-the-pieces-fit-together)
- [Screen-by-screen guide](#screen-by-screen-guide)
- [State management](#state-management)
- [API layer](#api-layer)
- [Project structure](#project-structure)
- [Styling conventions](#styling-conventions)
- [Linting](#linting)
- [Building for production](#building-for-production)
- [Troubleshooting](#troubleshooting)

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI library | React 19 | Function components + hooks throughout; no class components |
| Build tool | Vite 8 | Dev server with HMR; proxies `/api` to Flask (see below) |
| Routing | React Router 7 | Client-side routing, nested layout route |
| Icons | lucide-react | Single icon set used across navigation and pages |
| Styling | CSS Modules | One `*.module.css` file per component/page, no global CSS framework |
| Linting | oxlint | Fast Rust-based linter, configured in `.oxlintrc.json` |
| State | React Context + `localStorage` | No Redux/Zustand — see [State management](#state-management) |

No CSS-in-JS, no component library (MUI/AntD/etc.), no data-fetching library (React Query/SWR) — every network call goes through the single hand-written client in `src/api/client.js`, and every loading/error/empty state is composed from the small UI kit in `src/components/ui/`. This was a deliberate scope decision: the dashboard's job is to surface the dissertation's analytical results clearly, not to showcase framework breadth.

## Prerequisites

- **Node.js 18+** and npm
- The **Flask backend running first**, on `http://127.0.0.1:5000` — see [`../backend/README.md`](../backend/README.md). The dashboard has no data of its own; every page will show an error or empty state until the backend is reachable.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open it in a browser once the backend is also running. During development, any request the app makes to `/api/*` is transparently proxied to `http://127.0.0.1:5000` by the Vite dev server (configured in [`vite.config.js`](vite.config.js)) — the frontend code never hardcodes a backend host, so the same fetch calls work in dev and in a production build served behind a reverse proxy that forwards `/api`.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with hot module replacement |
| `npm run build` | Type-check-free production build, output to `dist/` |
| `npm run preview` | Serve the built `dist/` bundle locally, to sanity-check a production build |
| `npm run lint` | Run oxlint over the source tree |

## How the pieces fit together

```
┌─────────────────────────────────────────────────────────────────┐
│  App.jsx                                                         │
│   ├─ LeagueProvider          (selected league: IPL/PSL/BBL/...)  │
│   └─ ShortlistProvider       (player shortlist, persisted)       │
│        └─ BrowserRouter                                          │
│             └─ DashboardLayout   (Sidebar + Header + <Outlet/>)  │
│                  └─ 12 routed pages (src/pages/*)                │
│                       └─ src/api/client.js  ──HTTP──▶  Flask API │
└─────────────────────────────────────────────────────────────────┘
```

- **`main.jsx`** mounts `<App />` into `index.html`.
- **`App.jsx`** wraps the whole router tree in the two context providers, then declares every route under a single `DashboardLayout` parent route (React Router's nested-route pattern) so the sidebar/header persist across navigation while `<Outlet />` swaps the page content.
- **`DashboardLayout`** ([`src/layouts/DashboardLayout.jsx`](src/layouts/DashboardLayout.jsx)) owns only one piece of state — whether the mobile nav drawer is open — and composes `Sidebar` + `Header` around the routed page.
- **`src/config/navigation.js`** is the single source of truth for the sidebar's structure (flat links vs. collapsible groups, icons, labels, routes). Adding a page to the sidebar means adding one entry here — the `Sidebar` component itself contains no hardcoded routes.
- **`src/config/appConfig.js`** holds app-wide constants: display name, tagline, the five league codes, and the "data through" season shown in the header.

## Screen-by-screen guide

| Route | Page | What it shows | Backend endpoint(s) |
|---|---|---|---|
| `/` | Overview | League-level headline stats and dataset summary | `GET /api/overview` |
| `/players` | Player Directory | Filterable, sortable table of every player in a league (role, cluster, search) | `GET /api/player-directory` |
| `/player-profile` | Player Profile | Full career/season profile for one searched player | `GET /api/player-profile` |
| `/player-comparison` | Player Comparison | Side-by-side stat comparison of two players | `GET /api/player-profile` (×2) |
| `/kmeans-profiles` | K-Means Profiles | The general and role-specific K-Means player clusters (Ch. 4.6) | `GET /api/kmeans/profiles` |
| `/shortlist` | Player Shortlist | The user's saved shortlist of candidate players, persisted locally | *(client-side only — see below)* |
| `/similar-players` | Recommendation Search | KNN-based replacement recommendations for a chosen player (Ch. 4.11) | `GET /api/knn/recommendations` |
| `/knn-validation` | KNN Validation | Recommender stability/validation metrics (~83% stability figure) | `GET /api/knn/validation` |
| `/forecast` | Player Forecast | Next-season Poor/Average/Elite forecast for a searched player | `GET /api/forecast/player` |
| `/forecast#model-comparison` | Model Comparison | Random Forest vs. baselines vs. XGBoost/CatBoost/MLP/FT-Transformer comparison | `GET /api/forecast/model-comparison` |
| `/league-comparison` | League Comparison | Cross-league forecasting/experiment comparison (Ch. 4.10) | `GET /api/league-comparison` |
| `/team-optimiser?view=shortlist` | Team Optimiser — from shortlist | Runs the ILP optimiser live over the user's shortlisted players | `POST /api/ilp/shortlist-team` |
| `/team-optimiser?view=frozen` | Team Optimiser — frozen evaluation | Displays the dissertation's frozen, pre-computed ILP XIs and validation stats | `GET /api/ilp/team`, `GET /api/ilp/validation` |
| `/explainability` | Explainability | SHAP-grounded, per-player supporting/opposing factors for a forecast (Ch. 4.9) | `GET /api/explanations/player` |
| `/system-status` | System Status | Health/availability of the backend's loaded artifacts | `GET /api/system-status` |

Every data-bearing page follows the same pattern: a `PlayerSearchPanel` or filter control drives one or more calls into `src/api/client.js`, and the four states of that request — loading, error, empty, and populated — are rendered with the shared `LoadingState`, `ErrorState`, `EmptyState`, and page-specific result components from the UI kit. This consistency is intentional: an examiner can understand any page's data-fetching behaviour by having seen any other page.

## State management

There is no global state library. Two small React Contexts cover everything the app needs to share across pages:

- **`LeagueContext`** (`src/context/LeagueContext.jsx`) — holds the currently selected league (default `IPL`) and the fixed list of five league codes from `APP_CONFIG`. Selecting a league in the header updates every page that reads `useLeague()`.
- **`ShortlistContext`** (`src/context/ShortlistContext.jsx`) — holds the player shortlist the user builds up while browsing. It is **persisted to `localStorage`** under the key `cricselect-player-shortlist-v1`, so a shortlist survives a page refresh but lives only in that browser (there is no server-side shortlist storage — this is a client convenience, not a saved-account feature). Players are keyed by `league::player_name` to avoid cross-league collisions, and the context exposes `addPlayer`, `removePlayer`, `clearLeague`, and `isShortlisted`.

Each context is split into two files (`XContext.jsx` for the provider, `XContextCore.js` for the `createContext`/`useX` hook) purely so the hook can be imported by components without also pulling in the provider component — a common pattern for keeping Fast Refresh happy in Vite.

## API layer

`src/api/client.js` is the only file that calls `fetch`. It is intentionally minimal:

- One `apiRequest(path, options)` helper does the actual fetch, always sends `Accept: application/json`, parses the JSON body defensively (a non-JSON error page from a misconfigured proxy won't throw an unhandled exception), and throws a plain `Error` with the backend's `message` field whenever `response.ok` is false.
- One `queryString(params)` helper builds a `URLSearchParams` string while dropping `undefined`/`null`/empty values, so optional filters (role, cluster, sort, etc.) don't pollute the URL when unset.
- Every backend endpoint gets one small exported function (`fetchOverview`, `searchPlayers`, `fetchPlayerProfile`, `optimiseShortlistTeam`, …) that just shapes its parameters into a URL or POST body and calls `apiRequest`. Pages never construct URLs themselves.

This keeps every network call in one file with one error-handling convention, so tracing "what does this page fetch, and what happens if it fails" never requires jumping through abstraction layers.

## Project structure

```
frontend/
├── public/                    Static assets served as-is (favicon, sprite icons)
├── src/
│   ├── api/
│   │   └── client.js           Every backend call — see above
│   ├── components/
│   │   ├── navigation/         Sidebar, Header, BrandMark
│   │   ├── players/            PlayerSearchPanel — shared typeahead used on 6+ pages
│   │   └── ui/                 Small design-system kit (see below)
│   ├── config/
│   │   ├── appConfig.js        App name, tagline, league list, season
│   │   └── navigation.js       Sidebar structure (single source of truth for routes shown)
│   ├── context/                LeagueContext + ShortlistContext (provider/hook pairs)
│   ├── layouts/
│   │   └── DashboardLayout.jsx Sidebar + Header shell wrapping every routed page
│   ├── pages/                  One file per route — see the screen-by-screen table above
│   ├── styles/
│   │   ├── variables.css       CSS custom properties (colour, spacing, typography tokens)
│   │   └── global.css          Resets and base element styles
│   ├── utils/
│   │   └── csvExport.js        Client-side CSV export (used by the Shortlist/Directory tables)
│   ├── App.jsx                 Route table + context providers
│   └── main.jsx                React root / entry point
├── index.html                  Vite entry HTML
├── vite.config.js              Dev server + /api proxy to the Flask backend
├── .oxlintrc.json               Linter configuration
└── package.json
```

The **UI kit** in `src/components/ui/` (`PageHeader`, `Card`, `MetricCard`, `StatusBadge`, `Button`, `Select`, `SearchInput`, `EmptyState`, `LoadingState`, `ErrorState`, `WarningBanner`) is the closest thing this project has to a component library — every page is built almost entirely out of these eleven primitives plus its own page-specific presentational pieces, which is why the fourteen pages feel visually and behaviourally consistent despite being independent files.

`src/utils/csvExport.js` is worth a specific mention: it builds CSV client-side (correctly quoting/escaping fields and defusing values like `=SUM(...)` that spreadsheet software would otherwise execute as a formula) and triggers a download via a Blob URL, with no server round-trip — used wherever a page offers "export to CSV" (e.g. the Player Directory, Shortlist).

## Styling conventions

- **CSS Modules** (`Component.module.css`, imported as `styles` and referenced as `styles.className`) scope styles to their component — there is no global class-name collision risk, and deleting a component's `.jsx` file makes its styles dead and removable alongside it.
- **Design tokens** live in `src/styles/variables.css` as CSS custom properties (`--color-*`, `--space-*`, etc.); component styles consume the variables rather than hardcoding values, so the palette/spacing scale can be adjusted in one place.
- **`src/styles/global.css`** provides resets and base typography only — page layout is otherwise entirely the responsibility of each module.

## Linting

```bash
npm run lint
```

Runs [oxlint](https://oxc.rs) — a Rust-based linter — using the rules in [`.oxlintrc.json`](.oxlintrc.json). No Prettier/ESLint config is included; formatting is left to editor defaults.

## Building for production

```bash
npm run build
npm run preview   # optional: serve the dist/ build locally to verify it
```

`npm run build` type-checks nothing (this is JavaScript, not TypeScript — `@types/react`/`@types/react-dom` are present only so editors get accurate autocomplete) and outputs a static bundle to `dist/`. That bundle still expects `/api/*` requests to reach a Flask backend — in production this means serving `dist/` behind a reverse proxy (e.g. nginx) that forwards `/api` to the Flask process, mirroring what `vite.config.js`'s dev proxy does locally. `dist/` and `node_modules/` are git-ignored and are not part of this submission; regenerate them with the commands above.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every page shows an error/empty state | Backend isn't running on `127.0.0.1:5000`, or was started from the wrong working directory (it needs `Notebooks/` as a sibling — see `../backend/README.md`) |
| Shortlist "disappears" | It's stored per-browser in `localStorage`; a different browser/profile, or clearing site data, starts with an empty shortlist |
| `npm install` fails on `xgboost`/`torch`/etc. | Those are Python packages for the notebooks, not this frontend — check you're in `frontend/`, not `Notebooks/` |
| Changes to `src/config/navigation.js` don't add a working page | Adding a sidebar entry doesn't create a route — a matching `<Route>` must also exist in `App.jsx` pointing at a component in `src/pages/` |
