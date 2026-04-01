"""SHAP summary for yield model inside sklearn Pipeline."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

from .build_preprocessor import yield_X_y


def run_shap_summary(
    pipe: Pipeline,
    df: pd.DataFrame,
    out_path: Path,
    max_samples: int = 1500,
) -> Path | None:
    if "model" not in pipe.named_steps:
        return None
    model = pipe.named_steps["model"]
    prep = pipe.named_steps["prep"]
    X_df, _ = yield_X_y(df)
    X_df = X_df.sample(min(max_samples, len(X_df)), random_state=42)
    X_t = prep.transform(X_df)
    try:
        names = list(prep.get_feature_names_out())
    except Exception:
        names = [f"f{i}" for i in range(X_t.shape[1])]

    try:
        import shap

        if isinstance(model, LinearRegression):
            explainer = shap.LinearExplainer(model, X_t)
            sv = explainer.shap_values(X_t)
            sv = np.asarray(sv)
            plt.figure(figsize=(10, 6))
            shap.summary_plot(
                sv,
                X_t,
                feature_names=names,
                show=False,
                max_display=min(20, len(names)),
            )
        else:
            explainer = shap.TreeExplainer(model)
            sv = explainer.shap_values(X_t)
            if isinstance(sv, list):
                sv = sv[0]
            plt.figure(figsize=(10, 6))
            shap.summary_plot(
                sv,
                X_t,
                feature_names=names,
                show=False,
                max_display=min(20, len(names)),
            )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        plt.tight_layout()
        plt.savefig(out_path, dpi=150, bbox_inches="tight")
        plt.close()
        return out_path
    except Exception as e:
        print(f"SHAP plot skipped: {e}")
        return None
