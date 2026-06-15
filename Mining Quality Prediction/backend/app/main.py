import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, dashboard, dataset, historical, mining_sites, model_compare, predict, train

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load ML models into memory at startup."""
    from app.ml.model_cache import cache
    try:
        cache.load_models()
        logger.info("Model cache loaded successfully")
    except Exception as e:
        logger.warning(f"Could not pre-load models: {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered mining flotation silica quality prediction API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = settings.api_prefix
app.include_router(auth.router, prefix=api)
app.include_router(predict.router, prefix=api)
app.include_router(train.router, prefix=api)
app.include_router(dataset.router, prefix=api)
app.include_router(dashboard.router, prefix=api)
app.include_router(historical.router, prefix=api)
app.include_router(mining_sites.router, prefix=api)
app.include_router(model_compare.router, prefix=api)


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
