import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.ml.data_loader import load_mining_dataframe
from app.ml.predictor import SilicaPredictor
from app.schemas import PredictionInput, PredictionResponse

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("", response_model=PredictionResponse)
def predict_silica(body: PredictionInput):
    try:
        predictor = SilicaPredictor()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    result = predictor.predict_from_api(body.model_dump())
    return PredictionResponse(**result)


@router.post("/batch")
async def predict_batch(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV file required")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content), decimal=",")
    except Exception:
        df = pd.read_csv(io.BytesIO(content))

    try:
        predictor = SilicaPredictor()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    result_df = predictor.predict_batch_csv(df.head(5000))
    preview = result_df.head(100).to_dict(orient="records")
    stats = {}
    if "% Silica Concentrate" in result_df.columns:
        err = result_df["prediction_error"].dropna()
        stats = {
            "rmse": float((err**2).mean() ** 0.5),
            "mae": float(err.abs().mean()),
            "rows": len(result_df),
        }
    return {"preview": preview, "stats": stats}
