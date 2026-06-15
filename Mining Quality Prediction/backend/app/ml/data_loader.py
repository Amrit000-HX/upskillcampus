from pathlib import Path

import pandas as pd

from app.config import DEFAULT_DATASET, FALLBACK_DATASET, DATA_DIR
from app.constants import TARGET_COLUMN


def resolve_dataset_path(custom_path: Path | None = None) -> Path:
    if custom_path and custom_path.exists():
        return custom_path
    if DEFAULT_DATASET.exists():
        return DEFAULT_DATASET
    if FALLBACK_DATASET.exists():
        return FALLBACK_DATASET
    extracted = list((DATA_DIR / "extracted2").glob("*.csv"))
    if extracted:
        return extracted[0]
    raise FileNotFoundError(
        "Mining dataset not found. Run: py backend/scripts/extract_dataset.py"
    )


def _aggregate_to_hourly(df: pd.DataFrame) -> pd.DataFrame:
    """
    Lab silica/iron concentrate are measured hourly while process sensors run every ~20s.
    Aggregating prevents duplicate targets with conflicting features (major source of poor R²).
    """
    df = df.copy()
    df["hour"] = df["date"].dt.floor("h")
    numeric_cols = [c for c in df.columns if c not in ("date", "hour")]

    agg: dict[str, str] = {c: "mean" for c in numeric_cols if c != TARGET_COLUMN}
    if TARGET_COLUMN in df.columns:
        agg[TARGET_COLUMN] = "last"

    hourly = df.groupby("hour", as_index=False).agg(agg)
    hourly = hourly.rename(columns={"hour": "date"})
    return hourly.sort_values("date").reset_index(drop=True)


def load_mining_dataframe(
    path: Path | None = None,
    max_rows: int | None = None,
    hourly: bool = True,
) -> pd.DataFrame:
    dataset_path = resolve_dataset_path(path)
    df = pd.read_csv(
        dataset_path,
        decimal=",",
        nrows=max_rows,
        low_memory=False,
    )
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    df = df.sort_values("date").reset_index(drop=True)

    numeric_cols = [c for c in df.columns if c != "date"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    if TARGET_COLUMN in df.columns:
        df = df.dropna(subset=[TARGET_COLUMN])

    if hourly:
        df = _aggregate_to_hourly(df)

    return df
