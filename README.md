# Ledger Console

An executive P&L dashboard for utility-business finance. Light glassmorphism aesthetic, fully interactive, manual-entry data model with localStorage persistence.

Built with **Vite + React 18 + TypeScript + MUI v6**.

![Ledger Console](public/favicon.svg)

## Features

- **Live P&L computation** — every chart, KPI, delta, donut, and meter updates as you type in the data drawer.
- **Persistence** — your inputs are saved to `localStorage`. A Reset button restores defaults.
- **Philippine peso (₱) formatting** with `M`-suffix display (e.g., `₱245.3M`).
- **Interactive elements**:
  - Sidebar nav items are clickable + keyboard-accessible.
  - Topbar inbox/notifications/settings buttons fire toasts.
  - Avatar opens a menu (Profile, Preferences, Sign out).
  - Period segmented control (1W / 1M / MoM / QoQ / YTD) switches.
  - Waterfall bars show values on hover.
  - Bar rows highlight on hover.
  - Drawer accepts pasted values with commas; reformats on the fly.
  - Export CSV writes a real downloadable file.
- **Light glassmorphism** — warm parchment background, layered radial gradients, faint grid overlay, frosted panels.
- **Distinctive typography** — Instrument Serif for display, Inter for body, JetBrains Mono for numerics.

## Local development

```bash
npm install
npm run dev
```

Open the URL shown (typically http://localhost:5173).

```bash
npm run build      # type-check + production build → ./dist
npm run preview    # serve the production build locally
```

## Deploy to Vercel (via GitHub)

1. **Initialize a Git repo** in this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Ledger Console"
   ```
2. **Create a new repository on GitHub** (private is fine), then push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/ledger-console.git
   git push -u origin main
   ```
3. **Import on Vercel**:
   - Go to https://vercel.com/new
   - Select your `ledger-console` repository
   - Vercel auto-detects Vite. Defaults are correct:
     - Build command: `npm run build`
     - Output directory: `dist`
     - Install command: `npm install`
   - Click **Deploy**.

That's it. Subsequent `git push` to `main` will trigger automatic redeploys.

## Project structure

```
src/
├── App.tsx                       # Composition root
├── main.tsx                      # Entry: theme provider + font imports
├── components/
│   ├── LedgerLogo.tsx            # Custom brand SVG logo
│   ├── Sidebar.tsx               # Left navigation
│   ├── Topbar.tsx                # Breadcrumbs, search, actions, avatar
│   ├── PageHead.tsx              # Greeting, period selector, controls
│   ├── KpiGrid.tsx               # 4 KPI cards with sparklines + meters
│   ├── Waterfall.tsx             # P&L waterfall SVG chart
│   ├── MarginComposition.tsx     # Donut + bar breakdown
│   ├── TripleGrid.tsx            # Revenue mix, cost breakdown, activity
│   └── DataDrawer.tsx            # Slide-out data input panel
├── hooks/
│   └── usePnlState.ts            # State + localStorage + computation
├── theme/
│   └── theme.ts                  # MUI light glassmorphism theme
├── types/
│   └── pnl.ts                    # Type definitions
└── utils/
    ├── format.ts                 # Currency + delta formatters
    └── pnl.ts                    # P&L computation + seed values
```

## Data model

All inputs live in a single `PnlPeriod` object with `prior` and `current` periods, each holding nine line items:

- `opRev`, `othRev` — revenue components
- `power`, `om` — operating costs
- `deprec`, `interest` — non-operating costs
- `nonOpRev`, `nonOpExp` — adjustments
- `rfsc` — regulatory reset (kept gross)

Subtotals are derived in `computePeriod()`:

```
totalRev      = opRev + othRev
opMargin      = totalRev − power − om
netOpMargin   = opMargin − deprec − interest
netMargin     = netOpMargin + nonOpRev − nonOpExp
totalMargin   = netMargin + rfsc
```

## Notes on data

The seed values are **illustrative demo figures** — they don't reflect any real company. The workspace name (`Demo Utility Co.`) and user (`Alex Rivera, CFO`) are placeholders. Swap them in `Topbar.tsx` and `PageHead.tsx` for your own demo identity, but **never commit real client names, real executive names, or real financial figures** to a public repository.

## License

Demo project — use freely.
