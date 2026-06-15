import json
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.config import ARTIFACTS_DIR
from app.constants import TARGET_COLUMN
from app.ml.data_loader import load_mining_dataframe
from app.schemas import DatasetInsights

router = APIRouter(prefix="/dataset", tags=["Dataset Insights"])


@router.get("/insights", response_model=DatasetInsights)
def dataset_insights(sample_rows: int = 50000):
    try:
        df = load_mining_dataframe(max_rows=sample_rows)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    numeric = df.select_dtypes(include=[np.number])
    missing = (df.isnull().sum() / len(df) * 100).round(2)
    missing_dict = {k: float(v) for k, v in missing.items() if v > 0}

    corr = numeric.corr(numeric_only=True)
    target_corr = (
        corr[TARGET_COLUMN].drop(TARGET_COLUMN, errors="ignore").abs().sort_values(ascending=False)
        if TARGET_COLUMN in corr.columns
        else pd.Series(dtype=float)
    )
    top_pairs = [
        {"feature": feat, "correlation_with_silica": round(float(val), 4)}
        for feat, val in target_corr.head(10).items()
    ]

    fi_path = None
    latest = ARTIFACTS_DIR / "latest.json"
    if latest.exists():
        meta_dir = ARTIFACTS_DIR / json.loads(latest.read_text())["latest"]
        fi_path = meta_dir / "feature_importance.json"

    feature_importance = []
    if fi_path and fi_path.exists():
        feature_importance = json.loads(fi_path.read_text(encoding="utf-8"))

    target = df[TARGET_COLUMN]
    return DatasetInsights(
        row_count=len(df),
        column_count=len(df.columns),
        date_range={
            "start": str(df["date"].min()),
            "end": str(df["date"].max()),
        },
        missing_values=missing_dict,
        target_statistics={
            "mean": round(float(target.mean()), 4),
            "std": round(float(target.std()), 4),
            "min": round(float(target.min()), 4),
            "max": round(float(target.max()), 4),
            "median": round(float(target.median()), 4),
        },
        correlation_top_pairs=top_pairs,
        feature_importance=feature_importance,
        sampling_notes=(
            "Process variables sampled every ~20 seconds; lab targets (% Silica / % Iron "
            "Concentrate) updated hourly. Dataset spans March–September 2017."
        ),
    )


@router.get("/histogram/{column}")
def column_histogram(column: str, bins: int = 30, sample_rows: int = 30000):
    df = load_mining_dataframe(max_rows=sample_rows)
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found")
    series = df[column].dropna()
    counts, edges = np.histogram(series, bins=bins)
    return {
        "column": column,
        "bins": [
            {"start": round(float(edges[i]), 4), "end": round(float(edges[i + 1]), 4), "count": int(counts[i])}
            for i in range(len(counts))
        ],
    }
