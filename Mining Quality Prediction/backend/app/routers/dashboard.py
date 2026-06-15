import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import ARTIFACTS_DIR
from app.ml.data_loader import load_mining_dataframe
from app.ml.predictor import SilicaPredictor
from app.schemas import DashboardMetrics, PredictionInput

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def dashboard_metrics():
    try:
        df = load_mining_dataframe(max_rows=5000)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    target_col = "% Silica Concentrate"
    avg_silica = float(df[target_col].mean()) if target_col in df.columns else 0.0

    r2, rmse, accuracy = 0.0, 0.0, 0.0
    latest = ARTIFACTS_DIR / "latest.json"
    if latest.exists():
        meta_path = ARTIFACTS_DIR / json.loads(latest.read_text())["latest"] / "metadata.json"
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            m = meta.get("test_metrics", {})
            r2 = m.get("r2", 0)
            rmse = m.get("rmse", 0)
            accuracy = m.get("accuracy_percent", r2 * 100)

    recent = []
    if target_col in df.columns:
        tail = df.tail(48)
        for _, row in tail.iterrows():
            recent.append(
                {
                    "time": str(row["date"]),
                    "silica": round(float(row[target_col]), 3),
                }
            )

    alerts = []
    if avg_silica >= 2.0:
        alerts.append(
            {
                "level": "warning",
                "message": "Average silica above optimal band in recent sample window.",
            }
        )

    return DashboardMetrics(
        avg_silica_percent=round(avg_silica, 3),
        model_accuracy_percent=round(accuracy, 2),
        model_r2=round(r2, 4),
        model_rmse=round(rmse, 4),
        predictions_today=0,
        alerts=alerts,
        recent_series=recent,
    )


@router.get("/live-prediction")
def live_prediction():
    """Demo live metrics using trained model on typical operating point."""
    sample = PredictionInput()
    try:
        pred = SilicaPredictor().predict_from_api(sample.model_dump())
    except FileNotFoundError:
        return {"status": "model_not_trained"}
    return pred
