"""Singleton model cache for non-blocking inference.

Pre-loads all model artifacts at application startup so that
prediction requests avoid repeated disk I/O.
"""
import json
import logging
import threading
from pathlib import Path
from typing import Optional

import joblib

from app.config import ARTIFACTS_DIR
from app.ml.preprocessor import FeaturePipeline

logger = logging.getLogger(__name__)


class ModelCache:
    """Thread-safe singleton that holds all loaded ML models in memory."""

    _instance: Optional['ModelCache'] = None
    _lock = threading.Lock()

    def __new__(cls) -> 'ModelCache':
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.main_model = None
        self.pipeline: Optional[FeaturePipeline] = None
        self.metadata: dict = {}
        self.horizon_models: dict = {}
        self.horizon_pipelines: dict = {}
        self.lstm_models: dict = {}
        self.model_dir: Optional[Path] = None
        self._model_lock = threading.Lock()

    def _resolve_latest_dir(self) -> Path:
        marker = ARTIFACTS_DIR / 'latest.json'
        if marker.exists():
            data = json.loads(marker.read_text(encoding='utf-8'))
            path = ARTIFACTS_DIR / data['latest']
            if path.exists():
                return path
        dirs = sorted(ARTIFACTS_DIR.glob('model_*'), reverse=True)
        if not dirs:
            raise FileNotFoundError('No trained model found. Run training first.')
        return dirs[0]

    def load_models(self) -> None:
        """Load all model artifacts into memory. Called at app startup."""
        with self._model_lock:
            try:
                self.model_dir = self._resolve_latest_dir()
            except FileNotFoundError:
                logger.warning('No trained models found — cache remains empty.')
                return

            logger.info(f'Loading models from {self.model_dir}')

            # Main ensemble model
            model_path = self.model_dir / 'model.joblib'
            if model_path.exists():
                self.main_model = joblib.load(model_path)
                logger.info('Loaded main model')

            # Feature pipeline
            pipe_path = self.model_dir / 'pipeline.joblib'
            if pipe_path.exists():
                self.pipeline = FeaturePipeline.load(pipe_path)
                logger.info('Loaded feature pipeline')

            # Metadata
            meta_path = self.model_dir / 'metadata.json'
            if meta_path.exists():
                self.metadata = json.loads(meta_path.read_text(encoding='utf-8'))

            # Horizon models (tree-based)
            for label in ['1_hour', '3_hours', '6_hours']:
                h_model_path = self.model_dir / f'horizon_{label}.joblib'
                h_pipe_path = self.model_dir / f'horizon_{label}_pipeline.joblib'
                if h_model_path.exists():
                    self.horizon_models[label] = joblib.load(h_model_path)
                    if h_pipe_path.exists():
                        self.horizon_pipelines[label] = FeaturePipeline.load(h_pipe_path)
                    logger.info(f'Loaded horizon model: {label}')

            # LSTM models
            for label in ['3_hours', '6_hours']:
                lstm_path = self.model_dir / f'lstm_{label}.joblib'
                if lstm_path.exists():
                    from app.ml.lstm_model import LSTMForecaster
                    self.lstm_models[label] = LSTMForecaster.load(lstm_path)
                    logger.info(f'Loaded LSTM model: {label}')

            logger.info(f'Model cache loaded: main={self.main_model is not None}, '
                       f'horizons={list(self.horizon_models.keys())}, '
                       f'lstm={list(self.lstm_models.keys())}')

    def reload(self) -> None:
        """Force reload all models (e.g., after retraining)."""
        self._initialized = True
        self.main_model = None
        self.pipeline = None
        self.metadata = {}
        self.horizon_models = {}
        self.horizon_pipelines = {}
        self.lstm_models = {}
        self.model_dir = None
        self.load_models()

    @property
    def is_loaded(self) -> bool:
        return self.main_model is not None and self.pipeline is not None


# Module-level singleton
cache = ModelCache()
