"""
retrieval/clustering.py — v2
Thematic clustering of retrieved articles.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL
from utils.logger import log

_MODEL = None

def _get_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = SentenceTransformer(EMBEDDING_MODEL)
    return _MODEL


CLUSTER_LABELS = {
    0: "🎭 Deepfake Video & Face Swap",
    1: "🎙️ Voice Cloning & Audio Fraud",
    2: "🆔 Synthetic Identity & Account Takeover",
    3: "📧 AI-Powered Phishing & Social Engineering",
    4: "🌐 Disinformation & Synthetic Media",
    5: "🛡️ Detection & Countermeasures",
    6: "⚠️ Emerging Threats & Novel Techniques",
    7: "📰 General AI & Cybersecurity Intelligence",
}

CLUSTER_ANCHORS = [
    "deepfake video face swap video manipulation synthetic video generated video",
    "voice cloning audio spoofing synthetic voice phone fraud call scam AI voice",
    "synthetic identity account takeover biometric fraud identity theft AI impersonation",
    "AI phishing social engineering email scam impersonation spear phishing",
    "disinformation synthetic media propaganda AI-generated content fake news",
    "deepfake detection liveness detection countermeasure defence watermark authentication",
    "emerging threat novel technique new attack vector AI exploit generative AI abuse",
    "AI fraud cybersecurity intelligence artificial intelligence security",
]


def cluster_articles(articles: list[dict], threshold: float = 0.25) -> dict[str, list[dict]]:
    if not articles:
        return {}

    model = _get_model()
    anchor_embs = model.encode(CLUSTER_ANCHORS, normalize_embeddings=True, convert_to_numpy=True)

    texts = [f"{a.get('title','')} {a.get('text','')[:300]}" for a in articles]
    art_embs = model.encode(texts, batch_size=32, normalize_embeddings=True, convert_to_numpy=True)

    clusters: dict[str, list[dict]] = {v: [] for v in CLUSTER_LABELS.values()}

    for article, emb in zip(articles, art_embs):
        sims     = np.dot(anchor_embs, emb)
        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])

        label = CLUSTER_LABELS[best_idx] if best_sim >= threshold else CLUSTER_LABELS[7]
        clusters[label].append(article)

    return {k: v for k, v in clusters.items() if v}
