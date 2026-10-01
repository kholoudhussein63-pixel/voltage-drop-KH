# Advanced Voltage Drop & Cable Sizing Calculator

Next.js 14 (App Router) + React + Tailwind CSS engineering tool for verifying cable
voltage drop and selecting conductor sizes against standard mV/A/m tabulated values.

## Quick start

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start   # production
```

## What it does

- **Embedded conductor database** — copper mV/A/m factors for PVC/PVC and XLPE/PVC
  insulation across 1.5 mm² … 400 mm², exactly as specified in `lib/vdTable.js`.
  Aluminium values are derived with the IEC resistivity ratio (28.264 / 17.241 ≈ 1.639).
- **Automatic factor lookup** — selecting C.S.A + insulation + material fetches the base
  `mV` factor; the UI shows the retrieved value and the parallel-adjusted factor.
- **Parallel scaling** — `Adjusted mV = mV / N` for 1…4 parallel runs.
- **Formulas**
  - `V.D (Ind) = ((mV / N) × I_b × L) / 1000`
  - `V.D (Accm) = V.D (Ind) + V.D (US)`
  - `V.D % = (V.D (Accm) / V_Net) × 100`
- **Two calculation modes**
  - **Mode A** — single branch, with an optional upstream drop (V_US) so the branch can be
    the tail of a larger feeder.
  - **Mode B** — cumulative multi-section path, source → load, with the drop cascading
    section by section in an editable table.
- **Compliance & recommendations** — checks against the allowable limit (3% lighting,
  5% power, or custom), and proposes the smallest passing conductor, additional parallel
  circuits, or an upsize of the controlling section in a multi-section path. A conductor
  above 240 mm² automatically triggers a parallel-run recommendation.
- **History** — saved design cases persisted in `localStorage`; click a row to restore it.
- **Formula trace** — every result card is backed by a printed substitution of the numbers
  used, so designs can be checked by hand.

## Project structure

```
app/
  layout.js            root layout + metadata
  page.js              dashboard: state, mode switching, history, wiring of the engine
  globals.css          Tailwind layers + industrial dashboard component classes
components/
  DesignCriteria.jsx   V_Net, application type, allowable limit
  BranchInputs.jsx     Mode A branch inputs / Mode B shared conductor spec
  PathBuilder.jsx      Mode B editable multi-section cascade table
  ResultsPanel.jsx     result cards, limit utilisation, formula trace
  Recommendations.jsx  compliance messages + apply-able suggestions
  ReferenceTable.jsx   the embedded mV/A/m database
  HistoryTable.jsx     saved cases
  ui.jsx               shared field / metric / panel primitives
lib/
  vdTable.js           embedded database, options, lookupMv()
  calculator.js        computeSection, computeBranch, computePath,
                       evaluateCompliance, buildRecommendations
```

## Design notes

All calculation logic lives in `lib/` as pure functions, so it can be unit-tested or reused
server-side without React. The UI is a single client page composed of presentational
components.

This tool is a design aid. Final cable selection must also satisfy current-carrying capacity
(derating), short-circuit withstand, protective-device coordination and the governing
installation standard.
