"""
filtering/relevance_filter.py  — FIXED v2
─────────────────────────────────────────
Fixes applied:
  1. Lowered MIN_RELEVANCE_SCORE to 0.10 (was 0.35 — way too strict)
  2. Separated hard-reject logic: only reject when ZERO primary keyword hits
  3. Fast-path bypass extended: check secondary keywords too
  4. Composite formula rebalanced: 40% semantic + 60% keyword
     (pure semantic was failing because MiniLM scores for news text are inherently
      low; keywords are a much more reliable signal for this domain)
  5. Added debug score printing so you can see why articles pass/fail
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional
import numpy as np

from config import (
    PRIMARY_KEYWORDS,
    SECONDARY_KEYWORDS,
    REJECT_KEYWORDS,
    MIN_RELEVANCE_SCORE,
)
from utils.logger import log

# ── Lazy-loaded embedding model ───────────────────────────────────────────────
_SEMANTIC_MODEL    = None
_ANCHOR_EMBEDDING  = None

SEMANTIC_ANCHOR = (
    "deepfake voice cloning synthetic media AI identity fraud "
    "impersonation scam biometric spoofing AI-generated video audio"
)

def _get_model():
    global _SEMANTIC_MODEL, _ANCHOR_EMBEDDING
    if _SEMANTIC_MODEL is None:
        from sentence_transformers import SentenceTransformer
        log.info("Loading semantic filter model…")
        _SEMANTIC_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        _ANCHOR_EMBEDDING = _SEMANTIC_MODEL.encode(
            SEMANTIC_ANCHOR, convert_to_numpy=True, normalize_embeddings=True
        )
    return _SEMANTIC_MODEL, _ANCHOR_EMBEDDING


# ── Stage 1: Hard reject ──────────────────────────────────────────────────────
def _hard_reject(text: str) -> bool:
    """
    ONLY reject if:
      - 4+ generic noise keywords present  AND
      - ZERO primary deepfake keywords present
    This is much more lenient than before.
    """
    lower = text.lower()
    primary_hits = sum(1 for kw in PRIMARY_KEYWORDS if kw.lower() in lower)
    if primary_hits > 0:
        return False  # Any primary hit → never hard-reject
    reject_hits = sum(1 for kw in REJECT_KEYWORDS if kw.lower() in lower)
    return reject_hits >= 4


# ── Stage 2-3: Keyword scoring ────────────────────────────────────────────────
def _keyword_score(text: str) -> float:
    """
    0-1 score based on keyword density.
    Primary hit = 0.12 each, capped at 0.72
    Secondary hit = 0.04 each, capped at 0.28
    """
    lower = text.lower()
    primary_hits   = sum(1 for kw in PRIMARY_KEYWORDS   if kw.lower() in lower)
    secondary_hits = sum(1 for kw in SECONDARY_KEYWORDS if kw.lower() in lower)

    p_score = min(primary_hits   * 0.12, 0.72)
    s_score = min(secondary_hits * 0.04, 0.28)
    return min(p_score + s_score, 1.0)


# ── Stage 4: Semantic scoring ─────────────────────────────────────────────────
def _semantic_score(text: str) -> float:
    """Cosine similarity of article snippet vs deepfake anchor. Returns 0–1."""
    model, anchor_emb = _get_model()
    try:
        snippet = text[:600]
        emb = model.encode(snippet, convert_to_numpy=True, normalize_embeddings=True)
        score = float(np.dot(emb, anchor_emb))
        return max(0.0, min(score, 1.0))
    except Exception as e:
        log.debug(f"Semantic score error: {e}")
        return 0.0


# ── Master scoring ────────────────────────────────────────────────────────────
def score_article(article: dict) -> Optional[dict]:
    """
    Score a single article.
    
    Composite = 0.40 × semantic + 0.60 × keyword
    
    Returns article with 'relevance_score' if it passes MIN_RELEVANCE_SCORE,
    else None.
    """
    blob = " ".join(filter(None, [
        article.get("title",   ""),
        article.get("summary", ""),
        article.get("body",    ""),
        " ".join(article.get("tags", [])),
    ]))

    if not blob.strip():
        return None

    # Stage 1
    if _hard_reject(blob):
        log.debug(f"[HARD-REJECT] {article.get('title','')[:70]}")
        return None

    # Fast-path: if no keyword signal at all, skip expensive semantic call
    lower = blob.lower()
    has_any_signal = (
        any(kw.lower() in lower for kw in PRIMARY_KEYWORDS)
        or any(kw.lower() in lower for kw in SECONDARY_KEYWORDS)
    )
    if not has_any_signal:
        log.debug(f"[NO-SIGNAL] {article.get('title','')[:70]}")
        return None

    # Keyword score
    kw_score = _keyword_score(blob)

    # Semantic score (only run if keyword score > 0, saves time)
    sem_score = _semantic_score(blob) if kw_score > 0 else 0.0

    # Composite — keyword-weighted (more reliable for news domain)
    score = 0.40 * sem_score + 0.60 * kw_score

    # Priority source boost
    if article.get("priority", 2) == 1:
        score = min(score + 0.05, 1.0)

    log.debug(
        f"[SCORE] {score:.3f} (kw={kw_score:.3f} sem={sem_score:.3f}) | "
        f"{article.get('title','')[:60]}"
    )

    if score < MIN_RELEVANCE_SCORE:
        return None

    article["relevance_score"] = round(score, 4)
    return article


def filter_articles(articles: list[dict]) -> list[dict]:
    """Filter and score articles. Returns passing ones sorted by relevance DESC."""
    log.info(f"Scoring {len(articles)} articles (threshold={MIN_RELEVANCE_SCORE})…")
    passed = []
    for a in articles:
        scored = score_article(a)
        if scored:
            passed.append(scored)

    passed.sort(key=lambda x: x["relevance_score"], reverse=True)
    log.info(f"Filter result: {len(passed)}/{len(articles)} articles passed")

    if len(passed) == 0:
        log.warning(
            "⚠️  Zero articles passed. Check MIN_RELEVANCE_SCORE in .env "
            "(current=%.2f) or verify internet connectivity.",
            MIN_RELEVANCE_SCORE,
        )
    return passed
