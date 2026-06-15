import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.neural_network import MLPRegressor

from app.config import ARTIFACTS_DIR
from app.constants import HORIZON_STEPS, LSTM_DEFAULTS, TARGET_COLUMN
from app.ml.data_loader import load_mining_dataframe
from app.ml.preprocessor import (
    FeaturePipeline,
    build_feature_matrix,
    save_json,
    temporal_train_test_split,
)

try:
    import lightgbm as lgb
except ImportError:
    lgb = None

try:
    import xgboost as xgb
except ImportError:
    xgb = None


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.clip(np.abs(y_true), 1e-6, None))) * 100)
    accuracy = max(0.0, min(100.0, r2 * 100))
    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2": round(r2, 4),
        "mape": round(mape, 4),
        "accuracy_percent": round(accuracy, 2),
    }


def _build_estimator(algorithm: str):
    if algorithm == "random_forest":
        return RandomForestRegressor(
            n_estimators=200,
            max_depth=24,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=42,
        )
    if algorithm == "xgboost" and xgb is not None:
        return xgb.XGBRegressor(
            n_estimators=400,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=1.0,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=-1,
        )
    if algorithm == "lightgbm" and lgb is not None:
        return lgb.LGBMRegressor(
            n_estimators=500,
            max_depth=-1,
            learning_rate=0.05,
            num_leaves=64,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=0.5,
            random_state=42,
            n_jobs=-1,
            verbose=-1,
        )
    if algorithm == "neural_network":
        return MLPRegressor(
            hidden_layer_sizes=(128, 64, 32),
            activation="relu",
            max_iter=80,
            early_stopping=True,
            random_state=42,
        )
    if algorithm == "ensemble":
        estimators = [
            ("rf", _build_estimator("random_forest")),
        ]
        if lgb is not None:
            estimators.append(("lgb", _build_estimator("lightgbm")))
        if xgb is not None:
            estimators.append(("xgb", _build_estimator("xgboost")))
        return VotingRegressor(estimators=estimators, n_jobs=-1)
    if algorithm == "lstm":
        from app.ml.lstm_model import LSTMForecaster
        return LSTMForecaster(**LSTM_DEFAULTS)
    raise ValueError(f"Unsupported algorithm: {algorithm}")


def _feature_importance(model, feature_names: list[str]) -> list[dict[str, float]]:
    if hasattr(model, "estimators_"):
        importances = np.zeros(len(feature_names))
        for est in model.estimators_:
            if hasattr(est, "feature_importances_"):
                importances += est.feature_importances_
        importances /= max(len(model.estimators_), 1)
    elif hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        return []
    pairs = sorted(
        zip(feature_names, importances),
        key=lambda x: x[1],
        reverse=True,
    )[:15]
    return [{"feature": f, "importance": round(float(v), 4)} for f, v in pairs]


def train_models(
    algorithm: str = "ensemble",
    test_size: float = 0.2,
    max_rows: int | None = None,
    include_horizon_models: bool = True,
    dataset_path: Path | None = None,
) -> dict:
    logs: list[str] = []
    job_id = str(uuid.uuid4())[:8]

    def log(msg: str) -> None:
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}")

    log(f"Job {job_id}: loading dataset...")
    df = load_mining_dataframe(dataset_path, max_rows=max_rows)
    log(f"Loaded {len(df):,} rows from {df['date'].min()} to {df['date'].max()}")

    X_raw, feature_names = build_feature_matrix(df)
    y = df[TARGET_COLUMN].astype(float)
    X_raw = X_raw.iloc[1:]  # drop first row without lab lags
    y = y.iloc[1:]

    pipeline = FeaturePipeline()
    X_train, X_test, y_train, y_test = temporal_train_test_split(X_raw, y, test_size)
    X_train_s = pipeline.fit_transform(X_train)
    X_test_s = pipeline.transform(X_test)

    log(f"Training {algorithm} on {len(X_train):,} samples, {len(feature_names)} features...")
    model = _build_estimator(algorithm)
    model.fit(X_train_s, y_train)

    train_pred = model.predict(X_train_s)
    test_pred = model.predict(X_test_s)
    train_metrics = _metrics(y_train.values, train_pred)
    test_metrics = _metrics(y_test.values, test_pred)
    log(f"Validation RMSE={test_metrics['rmse']}, R2={test_metrics['r2']}, MAE={test_metrics['mae']}")

    version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    model_dir = ARTIFACTS_DIR / f"model_{version}"
    model_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, model_dir / "model.joblib")
    pipeline.save(model_dir / "pipeline.joblib")

    horizon_models = {}
    if include_horizon_models:
        for name, steps in HORIZON_STEPS.items():
            if steps >= len(df):
                continue
            y_shifted = y.shift(-steps)
            valid = ~y_shifted.isna()
            if valid.sum() < 1000:
                continue
            X_h = X_raw.loc[valid]
            y_h = y_shifted.loc[valid]
            X_tr, X_te, y_tr, y_te = temporal_train_test_split(X_h, y_h, test_size)
            hp = FeaturePipeline()
            X_tr_s = hp.fit_transform(X_tr)
            hm = _build_estimator("lightgbm" if lgb else "random_forest")
            hm.fit(X_tr_s, y_tr)
            h_metrics = _metrics(y_te.values, hm.predict(hp.transform(X_te)))
            horizon_models[name] = {
                "steps": steps,
                "metrics": h_metrics,
                "confidence_percent": round(max(60.0, min(98.0, h_metrics["r2"] * 100)), 1),
            }
            joblib.dump(hm, model_dir / f"horizon_{name}.joblib")
            hp.save(model_dir / f"horizon_{name}_pipeline.joblib")
            log(f"Horizon {name}: RMSE={h_metrics['rmse']}, confidence={horizon_models[name]['confidence_percent']}%")

    # Train LSTM-style sequential models for long horizons
    lstm_horizons = {}
    for name in ["3_hours", "6_hours"]:
        steps = HORIZON_STEPS.get(name)
        if steps is None or steps >= len(df):
            continue
        y_shifted = y.shift(-steps)
        valid = ~y_shifted.isna()
        if valid.sum() < 1000:
            continue
        try:
            from app.ml.lstm_model import LSTMForecaster
            lstm = LSTMForecaster(**LSTM_DEFAULTS)
            X_h = X_raw.loc[valid].values
            y_h = y_shifted.loc[valid].values
            split = int(len(X_h) * (1 - test_size))
            lstm_metrics = lstm.train(
                X_h[:split], y_h[:split],
                X_h[split:], y_h[split:]
            )
            lstm.save(model_dir / f"lstm_{name}.joblib")
            lstm_horizons[name] = {
                "metrics": lstm_metrics,
                "confidence_percent": round(max(60.0, min(98.0, lstm_metrics["r2"] * 100)), 1),
            }
            log(f"LSTM {name}: R2={lstm_metrics['r2']}, RMSE={lstm_metrics['rmse']}")
        except Exception as e:
            log(f"LSTM {name} training failed: {e}")

    metadata = {
        "job_id": job_id,
        "algorithm": algorithm,
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_samples": int(len(X_train)),
        "validation_samples": int(len(X_test)),
        "feature_count": len(feature_names),
        "feature_names": feature_names,
        "train_metrics": train_metrics,
        "test_metrics": test_metrics,
        "horizon_models": horizon_models,
        "lstm_horizons": lstm_horizons,
        "target": TARGET_COLUMN,
        "silica_thresholds": {"low": 1.5, "medium": 2.0, "high": 2.5},
    }
    save_json(metadata, model_dir / "metadata.json")
    save_json(_feature_importance(model, feature_names), model_dir / "feature_importance.json")

    # Point latest symlink via json marker
    save_json({"latest": str(model_dir.name)}, ARTIFACTS_DIR / "latest.json")

    return {
        "job_id": job_id,
        "status": "completed",
        "algorithm": algorithm,
        "metrics": test_metrics,
        "train_metrics": train_metrics,
        "feature_importance": _feature_importance(model, feature_names),
        "model_path": str(model_dir),
        "model_version": version,
        "training_samples": len(X_train),
        "validation_samples": len(X_test),
        "logs": logs,
        "horizon_models": horizon_models,
        "lstm_horizons": lstm_horizons,
    }
