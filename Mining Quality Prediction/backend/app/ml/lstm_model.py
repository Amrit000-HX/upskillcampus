"""LSTM-style sequential forecaster for long-horizon silica prediction.

Uses a sliding-window MLP approach that captures temporal patterns
without requiring TensorFlow/Keras installation.
"""
import json
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler


class LSTMForecaster:
    """Sequential forecaster using sliding-window MLP for time-series prediction.
    
    Reshapes tabular data into overlapping windows and trains an MLP
    to capture temporal dependencies, mimicking LSTM behavior.
    """

    def __init__(self, window_size: int = 12, hidden_layers: tuple = (256, 128, 64),
                 max_iter: int = 200, learning_rate_init: float = 0.001):
        self.window_size = window_size
        self.hidden_layers = hidden_layers
        self.max_iter = max_iter
        self.learning_rate_init = learning_rate_init
        self.model: Optional[MLPRegressor] = None
        self.scaler = StandardScaler()
        self.target_scaler = StandardScaler()
        self.feature_count: int = 0
        self.metrics: dict = {}

    def prepare_sequences(self, X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Create sliding window sequences from tabular data.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target values (n_samples,)
            
        Returns:
            X_windows: Flattened windows (n_windows, window_size * n_features)
            y_targets: Target for each window (n_windows,)
        """
        n_samples, n_features = X.shape
        self.feature_count = n_features
        
        if n_samples <= self.window_size:
            raise ValueError(f"Need > {self.window_size} samples, got {n_samples}")
        
        windows = []
        targets = []
        for i in range(self.window_size, n_samples):
            window = X[i - self.window_size:i].flatten()
            windows.append(window)
            targets.append(y[i])
        
        return np.array(windows), np.array(targets)

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray, y_val: np.ndarray) -> dict:
        """Train the sequential model.
        
        Args:
            X_train: Training feature matrix
            y_train: Training targets  
            X_val: Validation feature matrix
            y_val: Validation targets
            
        Returns:
            Dictionary with training metrics
        """
        # Prepare sequences
        X_train_seq, y_train_seq = self.prepare_sequences(X_train, y_train)
        X_val_seq, y_val_seq = self.prepare_sequences(X_val, y_val)
        
        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train_seq)
        X_val_scaled = self.scaler.transform(X_val_seq)
        y_train_scaled = self.target_scaler.fit_transform(y_train_seq.reshape(-1, 1)).ravel()
        
        # Build and train model
        self.model = MLPRegressor(
            hidden_layer_sizes=self.hidden_layers,
            activation='relu',
            solver='adam',
            max_iter=self.max_iter,
            learning_rate_init=self.learning_rate_init,
            early_stopping=True,
            validation_fraction=0.15,
            n_iter_no_change=15,
            random_state=42,
            batch_size=min(64, len(X_train_scaled)),
        )
        self.model.fit(X_train_scaled, y_train_scaled)
        
        # Evaluate
        val_pred_scaled = self.model.predict(X_val_scaled)
        val_pred = self.target_scaler.inverse_transform(val_pred_scaled.reshape(-1, 1)).ravel()
        
        from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
        self.metrics = {
            'r2': round(float(r2_score(y_val_seq, val_pred)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_val_seq, val_pred))), 4),
            'mae': round(float(mean_absolute_error(y_val_seq, val_pred)), 4),
            'window_size': self.window_size,
            'n_train_sequences': len(X_train_seq),
            'n_val_sequences': len(X_val_seq),
        }
        return self.metrics

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict using the last window_size rows of X."""
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first.")
        
        if len(X) < self.window_size:
            # Pad with zeros if not enough history
            pad = np.zeros((self.window_size - len(X), X.shape[1]))
            X = np.vstack([pad, X])
        
        # Use last window_size rows
        window = X[-self.window_size:].flatten().reshape(1, -1)
        window_scaled = self.scaler.transform(window)
        pred_scaled = self.model.predict(window_scaled)
        return self.target_scaler.inverse_transform(pred_scaled.reshape(-1, 1)).ravel()

    def save(self, path: Path) -> None:
        """Save model artifacts."""
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'target_scaler': self.target_scaler,
            'window_size': self.window_size,
            'feature_count': self.feature_count,
            'metrics': self.metrics,
            'hidden_layers': self.hidden_layers,
        }, path)

    @classmethod
    def load(cls, path: Path) -> 'LSTMForecaster':
        """Load model from disk."""
        data = joblib.load(path)
        obj = cls(
            window_size=data['window_size'],
            hidden_layers=data.get('hidden_layers', (256, 128, 64)),
        )
        obj.model = data['model']
        obj.scaler = data['scaler']
        obj.target_scaler = data['target_scaler']
        obj.feature_count = data['feature_count']
        obj.metrics = data.get('metrics', {})
        return obj
