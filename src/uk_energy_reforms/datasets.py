"""Pinned UK microdata. Both repos are private: set HF_TOKEN (or HUGGING_FACE_TOKEN)."""

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from functools import cache
from pathlib import Path


@dataclass(frozen=True)
class DatasetSpec:
    key: str
    label: str
    repo_id: str
    repo_type: str
    filename: str
    revision: str
    sha256: str
    notes: str


DATASETS: dict[str, DatasetSpec] = {
    spec.key: spec
    for spec in [
        DatasetSpec(
            key="microcosm_979",
            label="Microcosm UK 2024-25 (staged #979 national attempt)",
            repo_id="policyengine/populace-uk-private",
            repo_type="dataset",
            filename=(
                "staged/uk-frs-calibration-attempt-20260923T134002Z-c1be1c9f/"
                "microcosm_uk_2024_25.h5"
            ),
            revision="f6df65b1e98675ad305bcacf7ede3e0d34b57063",
            sha256="c5f107ab6eaf74d05c1e17ecd65a4f6876666c4554bd004f76102099aa6de821",
            notes=(
                "Energy spend priced with DESNZ QEP FY2024-25, raked to NEED, levelled "
                "to Energy Trends. Staged candidate, not a certified release."
            ),
        ),
        DatasetSpec(
            key="efrs_1573",
            label="Enhanced FRS 2024-25 (policyengine-uk-data 1.57.3)",
            repo_id="policyengine/policyengine-uk-data-private",
            repo_type="model",
            filename="enhanced_frs_2024_25.h5",
            revision="25af520a6651b8812fef56964a42a79a3f9f515a",
            sha256="ef34c1ae28219367981fbc3c1144f58ea1f8a77554165fe02ff395b04c5ffea5",
            notes=(
                "Energy spend imputed from LCFS and raked to NEED 2023 at Ofgem Q2-2026 "
                "unit rates. Weights are highly concentrated (Kish ESS about 1,100)."
            ),
        ),
    ]
}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


@cache
def dataset_path(key: str) -> Path:
    """Download (or reuse the cached copy of) a pinned dataset and verify its sha256."""
    from huggingface_hub import hf_hub_download

    spec = DATASETS[key]
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_TOKEN")
    path = Path(
        hf_hub_download(
            repo_id=spec.repo_id,
            filename=spec.filename,
            revision=spec.revision,
            repo_type=spec.repo_type,
            token=token,
        )
    )
    actual = _sha256(path)
    if actual != spec.sha256:
        raise ValueError(
            f"{key}: sha256 {actual} does not match the pinned {spec.sha256}"
        )
    return path
