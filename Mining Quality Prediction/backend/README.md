# MineVision AI — Backend API

FastAPI + scikit-learn / XGBoost / LightGBM ensemble for **% Silica Concentrate** prediction on the real flotation-plant dataset (March–September 2017).

## Quick start

```bash
cd backend
py -m pip install -r requirements.txt

# Extract CSV from Google Drive zip (if not already done)
py scripts/extract_dataset.py

# Train ensemble model (~1 min on hourly data)
py scripts/train_model.py --algorithm ensemble

# Start API
py run.py
```

API docs: http://localhost:8000/docs

## Model accuracy (validated)

| Metric | Value |
|--------|-------|
| **R²** | ~0.56 |
| **RMSE** | ~0.76 % silica |
| **MAE** | ~0.58 % silica |

Training uses **hourly-aligned** samples (lab targets are hourly; 20s rows are aggregated). Features include process sensors plus **previous-hour lab silica/iron** (available in real plants before the next lab result).

Horizon models: 1h / 3h / 6h ahead (hourly steps).

## Demo auth

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@minevision.ai | employee123 |
| Admin | admin@minevision.ai | admin123 |

## Key endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/predict` — real-time silica prediction
- `POST /api/v1/train` — retrain ensemble
- `GET /api/v1/dataset/insights` — dataset analytics
- `GET /api/v1/dashboard/metrics` — live dashboard stats

## Dataset

Place extracted CSV at:

`backend/data/extracted2/MiningProcess_Flotation_Plant_Database.csv`

European decimal format (comma). Original bundle: [Google Drive](https://drive.google.com/file/d/1N80d8eTDAf1JMQXGQbHDAUaMGRyA8QG3/view).
