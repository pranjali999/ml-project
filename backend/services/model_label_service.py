"""Human-readable names for sklearn estimators used in the yield pipeline."""

from __future__ import annotations

from typing import Any

from sklearn.pipeline import Pipeline


def yield_model_display_name(pipe_or_model: Any) -> str:
    """Return a short label like 'Random Forest' for API `model_used`."""
    if isinstance(pipe_or_model, Pipeline):
        reg = pipe_or_model.named_steps.get("model")
    else:
        reg = pipe_or_model
    if reg is None:
        return "Yield model"

    name = type(reg).__name__
    mapping = {
        "LinearRegression": "Linear Regression",
        "RandomForestRegressor": "Random Forest",
        "ExtraTreesRegressor": "Extra Trees",
        "DecisionTreeRegressor": "Decision Tree",
        "GradientBoostingRegressor": "Gradient Boosting",
        "XGBRegressor": "XGBoost",
        "HistGradientBoostingRegressor": "Hist Gradient Boosting",
        "AdaBoostRegressor": "AdaBoost",
        "ElasticNet": "Elastic Net",
        "Ridge": "Ridge Regression",
        "Lasso": "Lasso Regression",
    }
    return mapping.get(name, name.replace("Regressor", " Regressor").strip())
