import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler

from app.constants import EXCLUDED_FEATURES, FEATURE_API_MAP, TARGET_COLUMN

IRON_CONCENTRATE = "% Iron Concentrate"


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in EXCLUDED_FEATURES]


def api_input_to_row(payload: dict) -> dict[str, float]:
    row: dict[str, float] = {}
    for api_key, column in FEATURE_API_MAP.items():
        if api_key in payload and payload[api_key] is not None:
            row[column] = float(payload[api_key])
    return row


def build_feature_matrix(
    df: pd.DataFrame,
    previous_silica: float | None = None,
    previous_iron: float | None = None,
) -> tuple[pd.DataFrame, list[str]]:
    """Engineer features for flotation silica prediction (hourly-aligned data)."""
    base_cols = get_feature_columns(df)
    extra = [TARGET_COLUMN]
    if IRON_CONCENTRATE in df.columns:
        extra.append(IRON_CONCENTRATE)
    work = df[base_cols + [c for c in extra if c in df.columns]].copy()

    if TARGET_COLUMN in work.columns:
        work["silica_lab_lag1"] = work[TARGET_COLUMN].shift(1)
    elif previous_silica is not None:
        work["silica_lab_lag1"] = previous_silica
    if IRON_CONCENTRATE in work.columns:
        work["iron_lab_lag1"] = work[IRON_CONCENTRATE].shift(1)
    elif previous_iron is not None:
        work["iron_lab_lag1"] = previous_iron

    key_vars = [
        "% Silica Feed",
        "Ore Pulp pH",
        "Ore Pulp Density",
        "Starch Flow",
        "Amina Flow",
    ]
    for col in key_vars:
        if col in work.columns:
            work[f"{col}_lag1"] = work[col].shift(1)
            work[f"{col}_lag2"] = work[col].shift(2)
            work[f"{col}_lag3"] = work[col].shift(3)
            work[f"{col}_roll3"] = work[col].rolling(3, min_periods=1).mean()
            work[f"{col}_roll6"] = work[col].rolling(6, min_periods=1).mean()
            work[f"{col}_roc"] = work[col].pct_change().fillna(0)

    work["silica_feed_x_ph"] = work.get("% Silica Feed", 0) * work.get("Ore Pulp pH", 0)
    work["starch_amina_ratio"] = work.get("Starch Flow", 1) / (work.get("Amina Flow", 1) + 1e-6)
    air_cols = [c for c in work.columns if "Air Flow" in c and "lag" not in c and "roll" not in c]
    level_cols = [c for c in work.columns if "Level" in c and "lag" not in c and "roll" not in c]
    if air_cols:
        work["air_flow_total"] = work[air_cols].sum(axis=1)
    if level_cols:
        work["level_mean"] = work[level_cols].mean(axis=1)

    drop_cols = [c for c in (TARGET_COLUMN, IRON_CONCENTRATE) if c in work.columns]
    work = work.drop(columns=drop_cols, errors="ignore")

    work = work.replace([np.inf, -np.inf], np.nan).ffill().bfill()
    if previous_silica is None and "silica_lab_lag1" in work.columns:
        work["silica_lab_lag1"] = work["silica_lab_lag1"].fillna(work["silica_lab_lag1"].median())
    if previous_iron is None and "iron_lab_lag1" in work.columns:
        work["iron_lab_lag1"] = work["iron_lab_lag1"].fillna(work["iron_lab_lag1"].median())
    work = work.fillna(0)
    return work, list(work.columns)


def temporal_train_test_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.2,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    split_idx = int(len(X) * (1 - test_size))
    return X.iloc[:split_idx], X.iloc[split_idx:], y.iloc[:split_idx], y.iloc[split_idx:]


class FeaturePipeline:
    def __init__(self):
        self.scaler = RobustScaler()
        self.feature_names: list[str] = []

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        self.feature_names = list(X.columns)
        return self.scaler.fit_transform(X)

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        X = X.reindex(columns=self.feature_names, fill_value=0)
        return self.scaler.transform(X)

    def save(self, path: Path) -> None:
        import joblib

        joblib.dump(
            {"scaler": self.scaler, "feature_names": self.feature_names},
            path,
        )

    @classmethod
    def load(cls, path: Path) -> "FeaturePipeline":
        import joblib

        obj = cls()
        data = joblib.load(path)
        obj.scaler = data["scaler"]
        obj.feature_names = data["feature_names"]
        return obj


def save_json(data: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
