"""LangChain + FAISS RAG over bundled agricultural documents."""

from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Any

from config import get_config

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_vectorstore = None


def _load_documents() -> list[str]:
    cfg = get_config()
    path = cfg.DATA_DIR / "agriculture_knowledge.txt"
    if not path.exists():
        return [
            "Kharif crops are typically sown with monsoon onset and harvested in autumn.",
            "Rabi crops grow in winter with irrigation and are harvested in spring.",
            "Soil testing informs balanced fertilizer application and reduces cost.",
            "Drip irrigation improves water use efficiency in water-stressed regions.",
        ]
    text = path.read_text(encoding="utf-8")
    chunks = [p.strip() for p in text.split("\n\n") if p.strip()]
    return chunks


def _get_store():
    global _vectorstore
    with _lock:
        if _vectorstore is not None:
            return _vectorstore
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            from langchain_community.vectorstores import FAISS
        except ImportError as e:
            raise RuntimeError("langchain-community and faiss-cpu required for RAG") from e

        cfg = get_config()
        texts = _load_documents()
        logger.info("Building FAISS index over %d chunks (first load may download embeddings)", len(texts))
        emb = HuggingFaceEmbeddings(model_name=cfg.EMBEDDING_MODEL)
        _vectorstore = FAISS.from_texts(texts, emb)
        return _vectorstore


def query_rag(question: str, k: int = 4) -> dict[str, Any]:
    q = question.strip()
    if not q:
        return {"answer": "", "sources": []}
    try:
        store = _get_store()
        docs = store.similarity_search(q, k=k)
        context = "\n".join(d.page_content for d in docs)
        # Lightweight extractive answer (no extra LLM required)
        answer = (
            f"Based on retrieved agronomy notes:\n{context[:1200]}\n\n"
            f"(Refine with an LLM in production for fluent synthesis.)"
        )
        return {
            "answer": answer,
            "sources": [d.page_content[:200] + "..." for d in docs],
            "retrieval": "faiss",
        }
    except Exception as e:
        logger.exception("RAG failed")
        return {
            "answer": "RAG service unavailable. Check embeddings/FAISS installation.",
            "sources": [],
            "error": str(e),
        }
