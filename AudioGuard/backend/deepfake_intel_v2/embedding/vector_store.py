"""
embedding/vector_store.py - FIXED v2
ChromaDB embed, store, retrieve.
Fix: anonymized_telemetry moved to Settings correctly for chromadb 0.4.x
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from typing import Optional

import numpy as np
import chromadb
from sentence_transformers import SentenceTransformer

from config import (
    CHROMA_DB_PATH, CHROMA_COLLECTION, EMBEDDING_MODEL,
    TOP_K_RETRIEVAL, MAX_ARTICLES_PER_RUN,
)
from utils.text_utils import text_fingerprint, truncate
from utils.logger import log

_MODEL:      Optional[SentenceTransformer] = None
_CLIENT:     Optional[chromadb.PersistentClient] = None
_COLLECTION  = None


def _get_model() -> SentenceTransformer:
    global _MODEL
    if _MODEL is None:
        log.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _MODEL = SentenceTransformer(EMBEDDING_MODEL)
    return _MODEL


def _get_collection():
    global _CLIENT, _COLLECTION
    if _COLLECTION is None:
        # chromadb 0.4.x - telemetry flag via env var
        os.environ["ANONYMIZED_TELEMETRY"] = "False"
        _CLIENT = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        _COLLECTION = _CLIENT.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
        log.info(f"ChromaDB ready - {_COLLECTION.count()} existing docs")
    return _COLLECTION


def _existing_url_hashes() -> set[str]:
    col = _get_collection()
    try:
        results = col.get(include=["metadatas"])
        return {m.get("url_hash", "") for m in results["metadatas"]}
    except Exception:
        return set()


def _build_embed_text(article: dict) -> str:
    parts = [
        article.get("title",   ""),
        article.get("summary", ""),
        truncate(article.get("body", ""), 1500),
    ]
    return " ".join(p for p in parts if p).strip()


def embed_and_store(articles: list[dict]) -> int:
    col   = _get_collection()
    model = _get_model()

    existing = _existing_url_hashes()
    new_arts  = [a for a in articles if a.get("url_hash", "") not in existing]
    new_arts  = new_arts[:MAX_ARTICLES_PER_RUN]

    if not new_arts:
        log.info("No new articles to store.")
        return 0

    log.info(f"Embedding {len(new_arts)} articles…")
    texts = [_build_embed_text(a) for a in new_arts]

    embeddings = model.encode(
        texts, batch_size=32, show_progress_bar=True,
        normalize_embeddings=True, convert_to_numpy=True,
    ).tolist()

    ids, metas, docs = [], [], []
    for art, txt in zip(new_arts, texts):
        ids.append(art["url_hash"])
        metas.append({
            "title":           art.get("title", "")[:500],
            "url":             art.get("url", ""),
            "url_hash":        art.get("url_hash", ""),
            "source":          art.get("source", ""),
            "date":            art.get("date", ""),
            "relevance_score": str(art.get("relevance_score", 0.0)),
            "text_hash":       text_fingerprint(txt),
        })
        docs.append(truncate(txt, 2000))

    BATCH = 50
    for i in range(0, len(ids), BATCH):
        col.upsert(
            ids=ids[i:i+BATCH],
            embeddings=embeddings[i:i+BATCH],
            documents=docs[i:i+BATCH],
            metadatas=metas[i:i+BATCH],
        )

    log.info(f"Stored {len(new_arts)} articles. Total: {col.count()}")
    return len(new_arts)


def retrieve(query: str, top_k: int = TOP_K_RETRIEVAL, days_window: int = 30) -> list[dict]:
    col   = _get_collection()
    model = _get_model()
    total = col.count()

    if total == 0:
        log.warning("DB empty - run ingestion first.")
        return []

    query_emb = model.encode(
        query, convert_to_numpy=True, normalize_embeddings=True
    ).tolist()

    n_candidates = min(top_k * 3, total)
    results = col.query(
        query_embeddings=[query_emb],
        n_results=n_candidates,
        include=["documents", "metadatas", "distances"],
    )

    docs      = results["documents"][0]
    metas     = results["metadatas"][0]
    distances = results["distances"][0]

    now = datetime.now(timezone.utc)
    items = []
    for doc, meta, dist in zip(docs, metas, distances):
        sem_score = max(0.0, 1.0 - float(dist))

        try:
            pub = datetime.fromisoformat(meta.get("date", "")).replace(tzinfo=timezone.utc)
            age_days = max(0, (now - pub).days)
            recency  = max(0.0, 1.0 - age_days / days_window)
        except Exception:
            recency = 0.5

        blended = 0.70 * sem_score + 0.30 * recency

        items.append({
            "title":           meta.get("title", ""),
            "url":             meta.get("url", ""),
            "source":          meta.get("source", ""),
            "date":            meta.get("date", ""),
            "relevance_score": float(meta.get("relevance_score", 0.0)),
            "blended_score":   round(blended, 4),
            "text":            doc,
        })

    items.sort(key=lambda x: x["blended_score"], reverse=True)
    return items[:top_k]


def db_stats() -> dict:
    col = _get_collection()
    return {
        "total_documents": col.count(),
        "collection":      CHROMA_COLLECTION,
        "db_path":         str(CHROMA_DB_PATH),
    }
