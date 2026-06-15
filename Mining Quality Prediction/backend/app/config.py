from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_DATASET = DATA_DIR / "extracted2" / "MiningProcess_Flotation_Plant_Database.csv"
FALLBACK_DATASET = DATA_DIR / "MiningProcess_Flotation_Plant_Database.csv"


class Settings(BaseSettings):
    app_name: str = "MineVision AI API"
    api_prefix: str = "/api/v1"
    secret_key: str = "minevision-dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    default_model: str = "ensemble"
    max_upload_mb: int = 250

    class Config:
        env_file = ".env"


settings = Settings()
