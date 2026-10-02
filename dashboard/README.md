# Targeted energy discount dashboard

A static dashboard for the Resolution Foundation's targeted energy discount proposal
(*Billing me softly*, August 2026), built on the template of PolicyEngine's published UK
dashboards. Four tabs:

- **General impacts:** an Overview of cost, reach, gains, poverty and inequality, including
  region and household-type breakdowns. A separate **Eligibility across income measures**
  view explores qualification, spending and gains by different household income rankings.
- **Your household:** the selected scenario's discount and support curve first, with a
  collapsed comparison of all options. Household inputs persist when switching tabs;
  Calculate applies edited inputs to the estimate.
- **Baseline and comparisons:** households, bills and eligibility before the scheme, data
  coverage, the model beside official statistics and other organisations' estimates, and
  every figure the Resolution Foundation publishes beside PolicyEngine's.
- **Methodology:** a guided data → eligibility → payments → income effects explanation,
  with expandable technical detail, assumptions, sources and reproduction instructions.

General impacts and Your household share visible reform option, payment basis and year
controls. The URL preserves these selections and the active tab/view for sharing; household
inputs remain in browser memory and are not included in the URL.

The page shows the Microcosm dataset. The exported data also carry the Enhanced FRS for
internal use: add `?dataset=efrs_1573` to the URL to switch every tab to it.

Stack: Next.js 14 (App Router), React 18, Tailwind 3 with `@policyengine/design-system`
tokens, Recharts, bun. It is path-mounted for the policyengine.org multizone at
`/uk/targeted-energy-discount`.

## Data

Everything the page shows is pre-computed and served from `public/data/`:

- `targeted_energy_discount_results.json`: every option, set of amounts, year and dataset,
  the baseline, the 2024-25 replication, the report comparison and the external sources.
  Income distributions cover all 60 combinations of five reforms, three payment bases,
  two years and two datasets. Spending and gains use each scenario's household outcomes.
- `calculator.json`: the equivalence scale and household cases computed with
  policyengine-uk, which the JavaScript calculator in `src/lib/calculator.js` is tested
  against (`bun run test`).

Both are generated from the analysis folder by the Python package at the repository root:

```bash
# from the repository root, after the analysis runs (see analyses/rf-billing-me-softly)
uv run uk-energy-reforms export-dashboard --analysis analyses/rf-billing-me-softly \
  --out dashboard/public/data/targeted_energy_discount_results.json \
  --calculator-out dashboard/public/data/calculator.json
```

The files hold aggregate estimates and synthetic household cases only; no microdata is
committed.

## Develop

Needs bun 1.4 or later: `bun.lock` is a v2 lockfile, which bun 1.3 refuses (CI's
`setup-bun` reads the version from `packageManager` in `package.json`).

```bash
bun install
bun run dev      # http://localhost:3000/uk/targeted-energy-discount
bun run test
bun run build
```
