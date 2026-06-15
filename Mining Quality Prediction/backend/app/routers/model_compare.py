"""Model comparison endpoint.

Trains multiple algorithms on the same dataset split and returns
side-by-side performance metrics for comparison.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ml.trainer import train_models

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/model-compare", tags=["model-compare"])


class CompareRequest(BaseModel):
    algorithms: list[str] = Field(
        default=["random_forest", "xgboost", "lightgbm", "ensemble"],
        description="List of algorithms to compare",
    )
    test_size: float = 0.2
    max_rows: Optional[int] = 5000


@router.post("")
def compare_models(req: CompareRequest):
    """Train multiple algorithms and compare their performance."""
    results = []
    errors = []

    for algo in req.algorithms:
        try:
            logger.info(f"Training {algo} for comparison...")
            result = train_models(
                algorithm=algo,
                test_size=req.test_size,
                max_rows=req.max_rows,
                include_horizon_models=False,  # Skip horizons for speed
            )
            results.append({
                "algorithm": algo,
                "status": "success",
                "test_metrics": result["metrics"],
                "train_metrics": result["train_metrics"],
                "training_samples": result["training_samples"],
                "validation_samples": result["validation_samples"],
                "feature_importance": result["feature_importance"][:5],
            })
        except Exception as e:
            logger.error(f"Failed to train {algo}: {e}")
            errors.append({"algorithm": algo, "error": str(e)})

    # Sort by test R2 descending
    results.sort(key=lambda r: r["test_metrics"].get("r2", -999), reverse=True)

    return {
        "comparison": results,
        "errors": errors,
        "best_algorithm": results[0]["algorithm"] if results else None,
        "models_trained": len(results),
    }
