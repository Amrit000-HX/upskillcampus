from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File

from app.config import DATA_DIR
from app.constants import SUPPORTED_ALGORITHMS
from app.ml.trainer import train_models
from app.schemas import TrainRequest, TrainResponse

router = APIRouter(prefix="/train", tags=["Model Training"])

_training_status: dict = {"running": False, "last_result": None}


def _run_training(req: TrainRequest, dataset_path: Path | None = None) -> None:
    global _training_status
    _training_status["running"] = True
    try:
        result = train_models(
            algorithm=req.algorithm,
            test_size=req.test_size,
            max_rows=req.max_rows,
            include_horizon_models=req.include_horizon_models,
            dataset_path=dataset_path,
        )
        _training_status["last_result"] = result
    finally:
        _training_status["running"] = False


@router.get("/algorithms")
def list_algorithms():
    return {"algorithms": SUPPORTED_ALGORITHMS}


@router.get("/status")
def training_status():
    return {
        "running": _training_status["running"],
        "last_result": _training_status.get("last_result"),
    }


@router.post("", response_model=TrainResponse)
def train_sync(body: TrainRequest):
    if _training_status["running"]:
        raise HTTPException(status_code=409, detail="Training already in progress")
    try:
        result = train_models(
            algorithm=body.algorithm,
            test_size=body.test_size,
            max_rows=body.max_rows,
            include_horizon_models=body.include_horizon_models,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    _training_status["last_result"] = result
    return TrainResponse(
        job_id=result["job_id"],
        status=result["status"],
        algorithm=result["algorithm"],
        metrics=result["metrics"],
        feature_importance=result["feature_importance"],
        model_path=result["model_path"],
        training_samples=result["training_samples"],
        validation_samples=result["validation_samples"],
        logs=result["logs"],
    )


@router.post("/async")
def train_async(body: TrainRequest, background_tasks: BackgroundTasks):
    if _training_status["running"]:
        raise HTTPException(status_code=409, detail="Training already in progress")
    background_tasks.add_task(_run_training, body)
    return {"status": "started", "algorithm": body.algorithm}


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    dest = DATA_DIR / "uploaded_dataset.csv"
    content = await file.read()
    dest.write_bytes(content)
    return {"path": str(dest), "size_bytes": len(content)}
