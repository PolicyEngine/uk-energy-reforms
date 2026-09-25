# Targeted energy discount dashboard

A static dashboard for the Resolution Foundation's targeted energy discount proposal
(*Billing me softly*, August 2026), built on the template of PolicyEngine's published UK
dashboards. Four tabs:

- **Targeted energy discount:** cost, reach, gains by income decile, winners and losers,
  inequality, poverty, reach among low-income households and those with high energy costs,
  eligibility across income measures (equivalised and unequivalised household income and
  household taxable income, with a cross-tabulation and the households where eligibility and
  income diverge), breakdowns by region and household type, and the income cut-offs, for each
  option, set of amounts and year.
- **Your household:** the discount a household would get under each option, from its
  region, adults' taxable incomes, children, benefits and energy bill, recalculated when the
  reader presses Calculate.
- **Baseline and comparisons:** households, bills and eligibility before the scheme, data
  coverage, the model beside official statistics and other organisations' estimates, and
  every figure the Resolution Foundation publishes beside PolicyEngine's.
- **Methodology:** the assumptions behind every figure.

The page shows the Microcosm dataset. The exported data also carry the Enhanced FRS for
internal use: add `?dataset=efrs_1573` to the URL to switch every tab to it.

Stack: Next.js 14 (App Router), React 18, Tailwind 3 with `@policyengine/design-system`
tokens, Recharts, bun. It is path-mounted for the policyengine.org multizone at
`/uk/targeted-energy-discount`.

## Data

Everything the page shows is pre-computed and served from `public/data/`:

- `targeted_energy_discount_results.json`: every option, set of amounts, year and dataset,
  the baseline, the 2024-25 replication, the report comparison and the external sources.
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
