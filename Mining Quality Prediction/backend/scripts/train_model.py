"""Train the ensemble silica prediction model on the full flotation dataset."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.ml.trainer import train_models


def main():
    parser = argparse.ArgumentParser(description="Train MineVision silica predictor")
    parser.add_argument("--algorithm", default="ensemble", choices=[
        "random_forest", "xgboost", "lightgbm", "neural_network", "ensemble"
    ])
    parser.add_argument("--max-rows", type=int, default=None)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--no-horizons", action="store_true")
    args = parser.parse_args()

    result = train_models(
        algorithm=args.algorithm,
        test_size=args.test_size,
        max_rows=args.max_rows,
        include_horizon_models=not args.no_horizons,
    )
    print(json.dumps({
        "job_id": result["job_id"],
        "metrics": result["metrics"],
        "model_path": result["model_path"],
        "horizon_models": result.get("horizon_models", {}),
    }, indent=2))


if __name__ == "__main__":
    main()
