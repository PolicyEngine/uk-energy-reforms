"""Command line: ``uk-energy-reforms run`` and ``uk-energy-reforms rf-compare``."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from uk_energy_reforms.datasets import DATASETS
from uk_energy_reforms.reforms.targeted_energy_discount import PRESETS
from uk_energy_reforms.report import (
    _clean,
    markdown,
    rf_markdown,
    scenarios,
    write_json,
)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="uk-energy-reforms")
    sub = parser.add_subparsers(dest="command", required=True)

    r = sub.add_parser("run", help="Simulate targeted energy discount scenarios")
    r.add_argument("--datasets", nargs="+", default=["microcosm_979"], choices=DATASETS)
    r.add_argument("--year", type=int, default=2026)
    r.add_argument(
        "--presets", nargs="+", default=["rf_flat", "rf_tiered"], choices=PRESETS
    )
    r.add_argument(
        "--bill-share",
        action="store_true",
        help=(
            "Also run each preset as a bill-share discount (a share of annual gas and "
            "electricity spend) with the same averages"
        ),
    )
    r.add_argument(
        "--budget",
        type=float,
        default=None,
        help="Also run each preset rescaled to this total cost in GBP (e.g. 2e9)",
    )
    r.add_argument(
        "--take-up",
        type=float,
        default=1.0,
        help="Take-up among households eligible only through the income test",
    )
    r.add_argument("--out", type=Path, required=True)

    c = sub.add_parser("rf-compare", help="Set our estimates beside RF's figures")
    c.add_argument(
        "--datasets",
        nargs="+",
        default=["microcosm_979", "efrs_1573"],
        choices=DATASETS,
    )
    c.add_argument("--years", nargs="+", type=int, default=[2024, 2026])
    c.add_argument("--out", type=Path, required=True)

    e = sub.add_parser(
        "export-dashboard", help="Write the dashboard's pre-computed data"
    )
    e.add_argument("--analysis", type=Path, required=True)
    e.add_argument("--out", type=Path, required=True)

    args = parser.parse_args(argv)

    if args.command == "export-dashboard":
        from uk_energy_reforms.dashboard_data import write

        write(args.analysis, args.out)
        print(f"Wrote {args.out}")
        return

    args.out.mkdir(parents=True, exist_ok=True)
    if args.command == "run":
        results = scenarios(
            args.datasets,
            args.year,
            args.presets,
            bill_share=args.bill_share,
            budget=args.budget,
            take_up=args.take_up,
        )
        write_json(results, args.out / "results.json")
        (args.out / "report.md").write_text(markdown(results, args.year))
        print(f"Wrote {args.out / 'results.json'} and {args.out / 'report.md'}")
    else:
        from uk_energy_reforms.rf_comparison import compare

        comparison = compare(args.datasets, args.years)
        (args.out / "rf_comparison.json").write_text(
            json.dumps(_clean(comparison), indent=1)
        )
        (args.out / "rf_comparison.md").write_text(rf_markdown(comparison))
        print(f"Wrote {args.out / 'rf_comparison.json'} and rf_comparison.md")


if __name__ == "__main__":
    main()
