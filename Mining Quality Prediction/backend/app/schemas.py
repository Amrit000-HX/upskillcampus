from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Literal["employee", "admin"] = "employee"


class PredictionInput(BaseModel):
    iron_feed: float = Field(..., ge=0, le=100, description="% Iron Feed")
    silica_feed: float = Field(..., ge=0, le=100, description="% Silica Feed")
    starch_flow: float = Field(..., ge=0, description="Starch Flow m3/h")
    amina_flow: float = Field(..., ge=0, description="Amina Flow m3/h")
    ore_pulp_flow: float = Field(..., ge=0, description="Ore Pulp Flow t/h")
    ore_pulp_ph: float = Field(..., ge=0, le=14, description="Ore Pulp pH")
    ore_pulp_density: float = Field(..., ge=1, le=3, description="Ore Pulp Density")
    flotation_column_01_air_flow: float = 250.0
    flotation_column_02_air_flow: float = 250.0
    flotation_column_03_air_flow: float = 250.0
    flotation_column_04_air_flow: float = 295.0
    flotation_column_05_air_flow: float = 306.0
    flotation_column_06_air_flow: float = 250.0
    flotation_column_07_air_flow: float = 250.0
    flotation_column_01_level: float = 450.0
    flotation_column_02_level: float = 430.0
    flotation_column_03_level: float = 425.0
    flotation_column_04_level: float = 440.0
    flotation_column_05_level: float = 500.0
    flotation_column_06_level: float = 450.0
    flotation_column_07_level: float = 450.0
    previous_silica_concentrate: Optional[float] = Field(
        None, description="Last hourly lab % silica (strongly improves accuracy)"
    )
    previous_iron_concentrate: Optional[float] = Field(
        None, description="Last hourly lab % iron concentrate"
    )


class HorizonPrediction(BaseModel):
    time_step: str
    predicted_silica_percent: float
    confidence_percent: float
    risk_level: Literal["low", "medium", "high", "critical"]
    horizon_steps: int


class PredictionResponse(BaseModel):
    predicted_silica_percent: float
    risk_level: str
    confidence_percent: float
    horizons: list[HorizonPrediction]
    recommendations: list[str]
    corrective_actions: list[str]
    model_version: str
    metrics: dict[str, float]


class TrainRequest(BaseModel):
    algorithm: Literal[
        "random_forest", "xgboost", "lightgbm", "neural_network", "ensemble", "lstm"
    ] = "ensemble"
    test_size: float = Field(0.2, ge=0.1, le=0.4)
    max_rows: Optional[int] = Field(None, description="Limit rows for faster training")
    include_horizon_models: bool = True


class TrainResponse(BaseModel):
    job_id: str
    status: str
    algorithm: str
    metrics: dict[str, float]
    feature_importance: list[dict[str, float]]
    model_path: str
    training_samples: int
    validation_samples: int
    logs: list[str]


class DatasetInsights(BaseModel):
    row_count: int
    column_count: int
    date_range: dict[str, str]
    missing_values: dict[str, float]
    target_statistics: dict[str, float]
    correlation_top_pairs: list[dict[str, Any]]
    feature_importance: list[dict[str, float]]
    sampling_notes: str


class DashboardMetrics(BaseModel):
    avg_silica_percent: float
    model_accuracy_percent: float
    model_r2: float
    model_rmse: float
    predictions_today: int
    alerts: list[dict[str, Any]]
    recent_series: list[dict[str, Any]]
