# Targeted energy discount dashboard

A static dashboard for the Resolution Foundation's targeted energy discount proposal:
who each option reaches, what it costs, its distributional and poverty effects,
breakdowns by region and household type, income-threshold cliffs, and PolicyEngine's
estimates beside the report's own figures.

Stack: Next.js (App Router), Tailwind v4 with `@policyengine/ui-kit` 0.4.0, Recharts,
bun. It is path-mounted for the policyengine.org multizone at
`/uk/targeted-energy-discount`.

## Data

Everything the page shows is pre-computed. `data/results.json` is generated from the
analysis folder by the Python package at the repository root:

```bash
# from the repository root, after the analysis runs (see analyses/rf-billing-me-softly)
uv run uk-energy-reforms export-dashboard \
  --analysis analyses/rf-billing-me-softly --out dashboard/data/results.json
```

The file holds aggregate estimates only; no microdata is committed.

## Develop

```bash
bun install
bun run dev      # http://localhost:3000/uk/targeted-energy-discount
bun run lint
bun run build
```
