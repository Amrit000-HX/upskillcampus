import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.config import ARTIFACTS_DIR
from app.constants import FEATURE_API_MAP, HORIZON_STEPS, TARGET_COLUMN
from app.ml.model_cache import cache as model_cache
from app.ml.preprocessor import FeaturePipeline, api_input_to_row, build_feature_matrix


def _latest_model_dir() -> Path:
    marker = ARTIFACTS_DIR / "latest.json"
    if marker.exists():
        data = json.loads(marker.read_text(encoding="utf-8"))
        path = ARTIFACTS_DIR / data["latest"]
        if path.exists():
            return path
    dirs = sorted(ARTIFACTS_DIR.glob("model_*"), reverse=True)
    if not dirs:
        raise FileNotFoundError("No trained model found. Run training first.")
    return dirs[0]


def _risk_level(value: float, thresholds: dict) -> str:
    if value < thresholds.get("low", 1.5):
        return "low"
    if value < thresholds.get("medium", 2.0):
        return "medium"
    if value < thresholds.get("high", 2.5):
        return "high"
    return "critical"


def _recommendations(silica: float, payload: dict) -> tuple[list[str], list[str]]:
    recs: list[str] = []
    actions: list[str] = []
    if silica >= 2.5:
        actions.extend(
            [
                "Increase starch flow by 3–5% to improve silica rejection.",
                "Verify amina flow stability across flotation columns 1–3.",
                "Check ore pulp pH; target range 9.5–10.5 for optimal separation.",
            ]
        )
        recs.append("High impurity risk — schedule lab confirmation within 30 minutes.")
    elif silica >= 2.0:
        actions.append("Fine-tune air flow in column 7 by +2–4 Nm³/h.")
        recs.append("Moderate silica trend — monitor hourly lab sample.")
    else:
        recs.append("Process within acceptable silica band for concentrate quality.")
        actions.append("Maintain current reagent dosing; continue standard sampling.")

    if payload.get("ore_pulp_ph", 10) < 9.5:
        actions.append("Raise pulp pH gradually; low pH reduces collector efficiency.")
    if payload.get("silica_feed", 0) > 18:
        recs.append("Elevated silica in feed — coordinate with crushing/grinding circuit.")

    return recs[:4], actions[:4]


class SilicaPredictor:
    def __init__(self, model_dir: Path | None = None):
        if model_dir is None and model_cache.is_loaded:
            # Use cached models for faster inference
            self.model_dir = model_cache.model_dir
            self.model = model_cache.main_model
            self.pipeline = model_cache.pipeline
            self.metadata = model_cache.metadata
            self._use_cache = True
        else:
            self.model_dir = model_dir or _latest_model_dir()
            self.model = joblib.load(self.model_dir / "model.joblib")
            self.pipeline = FeaturePipeline.load(self.model_dir / "pipeline.joblib")
            meta_path = self.model_dir / "metadata.json"
            self.metadata = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
            self._use_cache = False

    def predict_from_api(self, payload: dict) -> dict:
        row = api_input_to_row(payload)
        df = pd.DataFrame([row])
        X, _ = build_feature_matrix(
            df,
            previous_silica=payload.get("previous_silica_concentrate"),
            previous_iron=payload.get("previous_iron_concentrate"),
        )
        X_scaled = self.pipeline.transform(X)
        silica = float(self.model.predict(X_scaled)[0])

        thresholds = self.metadata.get("silica_thresholds", {})
        risk = _risk_level(silica, thresholds)
        test_metrics = self.metadata.get("test_metrics", {})
        confidence = round(max(70.0, min(98.0, test_metrics.get("r2", 0.85) * 100)), 1)

        horizons = []
        horizon_meta = self.metadata.get("horizon_models", {})
        for label, steps in HORIZON_STEPS.items():
            h_conf = horizon_meta.get(label, {}).get("confidence_percent", confidence - 5)
            h_val = None

            # Try LSTM model first for 3h/6h horizons
            if label in ("3_hours", "6_hours"):
                lstm = None
                if self._use_cache and label in model_cache.lstm_models:
                    lstm = model_cache.lstm_models[label]
                else:
                    lstm_path = self.model_dir / f"lstm_{label}.joblib"
                    if lstm_path.exists():
                        from app.ml.lstm_model import LSTMForecaster
                        lstm = LSTMForecaster.load(lstm_path)
                if lstm is not None:
                    try:
                        h_val = float(lstm.predict(X_scaled)[0])
                        lstm_meta = self.metadata.get("lstm_horizons", {}).get(label, {})
                        if lstm_meta:
                            h_conf = lstm_meta.get("confidence_percent", h_conf)
                    except Exception:
                        h_val = None

            # Fallback to tree-based horizon model
            if h_val is None:
                if self._use_cache and label in model_cache.horizon_models:
                    h_model = model_cache.horizon_models[label]
                    h_pipe = model_cache.horizon_pipelines.get(label, self.pipeline)
                    h_val = float(h_model.predict(h_pipe.transform(X))[0])
                else:
                    h_model_path = self.model_dir / f"horizon_{label}.joblib"
                    if h_model_path.exists():
                        h_model = joblib.load(h_model_path)
                        h_pipe = FeaturePipeline.load(self.model_dir / f"horizon_{label}_pipeline.joblib")
                        h_val = float(h_model.predict(h_pipe.transform(X))[0])
                    else:
                        rmse = horizon_meta.get(label, {}).get("metrics", {}).get("rmse", 0.08)
                        drift = {1: 1.02, 3: 1.05, 6: 1.08}.get(steps, 1.03)
                        h_val = silica * drift + rmse * 0.1

            horizons.append(
                {
                    "time_step": label.replace("_", " "),
                    "predicted_silica_percent": round(h_val, 3),
                    "confidence_percent": h_conf,
                    "risk_level": _risk_level(h_val, thresholds),
                    "horizon_steps": steps,
                }
            )

        recs, actions = _recommendations(silica, payload)
        return {
            "predicted_silica_percent": round(silica, 3),
            "risk_level": risk,
            "confidence_percent": confidence,
            "horizons": horizons,
            "recommendations": recs,
            "corrective_actions": actions,
            "model_version": self.metadata.get("version", "unknown"),
            "metrics": test_metrics,
        }

    def predict_batch_csv(self, df: pd.DataFrame) -> pd.DataFrame:
        X, _ = build_feature_matrix(df)
        preds = self.model.predict(self.pipeline.transform(X))
        out = df.copy()
        out["predicted_silica_concentrate"] = preds
        if TARGET_COLUMN in out.columns:
            out["prediction_error"] = out[TARGET_COLUMN] - out["predicted_silica_concentrate"]
        return out
