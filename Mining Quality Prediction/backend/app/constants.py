"""Column mappings for the flotation plant dataset (24 columns)."""

TARGET_COLUMN = "% Silica Concentrate"
EXCLUDED_FEATURES = {"date", "% Iron Concentrate", TARGET_COLUMN}

# API snake_case -> dataset column name
FEATURE_API_MAP: dict[str, str] = {
    "iron_feed": "% Iron Feed",
    "silica_feed": "% Silica Feed",
    "starch_flow": "Starch Flow",
    "amina_flow": "Amina Flow",
    "ore_pulp_flow": "Ore Pulp Flow",
    "ore_pulp_ph": "Ore Pulp pH",
    "ore_pulp_density": "Ore Pulp Density",
    "flotation_column_01_air_flow": "Flotation Column 01 Air Flow",
    "flotation_column_02_air_flow": "Flotation Column 02 Air Flow",
    "flotation_column_03_air_flow": "Flotation Column 03 Air Flow",
    "flotation_column_04_air_flow": "Flotation Column 04 Air Flow",
    "flotation_column_05_air_flow": "Flotation Column 05 Air Flow",
    "flotation_column_06_air_flow": "Flotation Column 06 Air Flow",
    "flotation_column_07_air_flow": "Flotation Column 07 Air Flow",
    "flotation_column_01_level": "Flotation Column 01 Level",
    "flotation_column_02_level": "Flotation Column 02 Level",
    "flotation_column_03_level": "Flotation Column 03 Level",
    "flotation_column_04_level": "Flotation Column 04 Level",
    "flotation_column_05_level": "Flotation Column 05 Level",
    "flotation_column_06_level": "Flotation Column 06 Level",
    "flotation_column_07_level": "Flotation Column 07 Level",
}

# Horizons in hourly steps (after lab-aligned resampling)
HORIZON_STEPS = {
    "1_hour": 1,
    "3_hours": 3,
    "6_hours": 6,
}

SUPPORTED_ALGORITHMS = [
    "random_forest",
    "xgboost",
    "lightgbm",
    "neural_network",
    "ensemble",
    "lstm",
]

# LSTM hyperparameter defaults
LSTM_DEFAULTS = {
    "window_size": 12,
    "hidden_layers": (256, 128, 64),
    "max_iter": 200,
    "learning_rate_init": 0.001,
}

DEMO_USERS = {
    "employee@minevision.ai": {
        "password": "employee123",
        "role": "employee",
        "name": "Plant Engineer",
    },
    "admin@minevision.ai": {
        "password": "admin123",
        "role": "admin",
        "name": "System Administrator",
    },
}
