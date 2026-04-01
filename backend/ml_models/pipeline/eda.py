"""Exploratory data analysis plots."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from .config import EDA_DIR


def run_eda(df: pd.DataFrame, out_dir: Path | None = None) -> list[Path]:
    out_dir = out_dir or EDA_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []

    # 1) Yield vs Rainfall scatter
    fig, ax = plt.subplots(figsize=(8, 5))
    sample = df.sample(min(5000, len(df)), random_state=42)
    ax.scatter(sample["rainfall"], sample["yield"], alpha=0.35, s=12, c="#0d9488")
    ax.set_xlabel("Rainfall (mm)")
    ax.set_ylabel("Yield (production / area)")
    ax.set_title("Yield vs Rainfall")
    p1 = out_dir / "yield_vs_rainfall.png"
    fig.tight_layout()
    fig.savefig(p1, dpi=150)
    plt.close(fig)
    paths.append(p1)

    # 2) Crop distribution
    fig, ax = plt.subplots(figsize=(10, 5))
    top = df["crop"].value_counts().head(20)
    top.plot(kind="bar", ax=ax, color="#6366f1")
    ax.set_title("Top crops by row count")
    ax.set_xlabel("Crop")
    ax.set_ylabel("Count")
    plt.xticks(rotation=45, ha="right")
    p2 = out_dir / "crop_distribution.png"
    fig.tight_layout()
    fig.savefig(p2, dpi=150)
    plt.close(fig)
    paths.append(p2)

    # 3) Correlation heatmap (numeric)
    num = df.select_dtypes(include=[np.number]).copy()
    if num.shape[1] >= 2:
        fig, ax = plt.subplots(figsize=(8, 6))
        corr = num.corr(numeric_only=True)
        sns.heatmap(corr, annot=True, fmt=".2f", cmap="vlag", ax=ax)
        ax.set_title("Correlation heatmap")
        p3 = out_dir / "correlation_heatmap.png"
        fig.tight_layout()
        fig.savefig(p3, dpi=150)
        plt.close(fig)
        paths.append(p3)

    return paths
