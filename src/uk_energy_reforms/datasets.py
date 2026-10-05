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
        # Release microcosm-uk-2024-25-national, published 4 October 2026: the
        # commit of its immutable cut tag
        # microcosm-uk-2024-25-national-20261002T230158Z-5c6b3f68 (the same bytes as
        # microcosm_uk_2024_25.h5 on main). Built with policyengine-uk 2.100.0.
        DatasetSpec(
            key="microcosm_national",
            label="Microcosm UK 2024-25 (national release)",
            repo_id="policyengine/populace-uk-private",
            repo_type="dataset",
            filename="microcosm_uk_2024_25.h5",
            revision="f9d1922cddab6b54a0dd37794a9bac74e3780c88",
            sha256="aa31bdf67c977927ea2b325567d1cf7a79d94381239bc79918a0a0fc9c9588af",
            notes=(
                "Energy spend priced with DESNZ QEP FY2024-25, raked to NEED, levelled "
                "to Energy Trends. Certified release, published 4 October 2026."
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
                "unit rates. Weights are highly concentrated (Kish ESS about 1,100) and "
                "sum to 30.7m GB households in 2026-27, about 7% above Microcosm (28.6m) "
                "and 10% above RF's 28m, so its counts run high."
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
