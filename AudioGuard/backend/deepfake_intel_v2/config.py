"""
config.py - Central configuration for Aware & Sincere RAG System
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR       = Path(__file__).parent
REPORT_DIR     = BASE_DIR / os.getenv("REPORT_DIR", "data/reports")
CHROMA_DB_PATH = BASE_DIR / os.getenv("CHROMA_DB_PATH", "data/chroma_db")
LOG_DIR        = BASE_DIR / "data" / "logs"

for _d in [REPORT_DIR, CHROMA_DB_PATH, LOG_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

# ── API Keys ──────────────────────────────────────────────────────────────────
NEWS_API_KEY  = os.getenv("NEWS_API_KEY", "")
GDELT_ENABLED = os.getenv("GDELT_ENABLED", "false").lower() == "true"

# ── Embedding ─────────────────────────────────────────────────────────────────
EMBEDDING_MODEL   = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_COLLECTION = "deepfake_intel"

# ── Retrieval / Scoring ───────────────────────────────────────────────────────
TOP_K_RETRIEVAL      = int(os.getenv("TOP_K_RETRIEVAL", "20"))
MIN_RELEVANCE_SCORE  = float(os.getenv("MIN_RELEVANCE_SCORE", "0.10"))
MAX_ARTICLES_PER_RUN = int(os.getenv("MAX_ARTICLES_PER_RUN", "150"))

# ── Scheduler ─────────────────────────────────────────────────────────────────
DAILY_RUN_TIME = os.getenv("DAILY_RUN_TIME", "07:00")

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ── RSS Feed Sources ──────────────────────────────────────────────────────────
RSS_FEEDS = [
    {"name": "Wired Security",        "url": "https://www.wired.com/feed/category/security/latest/rss",           "priority": 1},
    {"name": "MIT Technology Review", "url": "https://www.technologyreview.com/feed/",                            "priority": 1},
    {"name": "Ars Technica",          "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",          "priority": 1},
    {"name": "BleepingComputer",      "url": "https://www.bleepingcomputer.com/feed/",                            "priority": 2},
    {"name": "The Hacker News",       "url": "https://feeds.feedburner.com/TheHackersNews",                       "priority": 2},
    {"name": "Schneier on Security",  "url": "https://www.schneier.com/blog/atom.xml",                            "priority": 1},
    {"name": "Sophos News",           "url": "https://news.sophos.com/en-us/feed/",                               "priority": 2},
    {"name": "Dark Reading",          "url": "https://www.darkreading.com/rss.xml",                               "priority": 2},
    {"name": "Krebs on Security",     "url": "https://krebsonsecurity.com/feed/",                                 "priority": 1},
    {"name": "SecurityWeek",          "url": "https://feeds.feedburner.com/securityweek",                         "priority": 2},
    {"name": "The Register Security", "url": "https://www.theregister.com/security/headlines.atom",               "priority": 2},
]

# ── Primary Keywords (deepfake / AI-fraud focused) ────────────────────────────
PRIMARY_KEYWORDS = [
    "deepfake", "deep fake", "deepfakes", "deepfaked",
    "synthetic media", "synthetic video", "synthetic audio", "synthetic identity",
    "voice cloning", "voice clone", "voice synthesis", "cloned voice",
    "AI-generated", "AI generated", "AI-powered scam", "AI-powered fraud",
    "generative AI", "generative adversarial", "GAN fraud",
    "audio spoofing", "video spoofing", "face swap", "faceswap",
    "neural fake", "AI impersonation", "digital clone", "digital impersonation",
    "liveness detection", "biometric spoofing",
    "identity fraud", "AI fraud", "AI crime",
    "diffusion model abuse", "LLM fraud", "LLM scam",
    "AI disinformation", "AI misinformation", "synthetic content",
    "AI phishing", "AI social engineering",
    "deepfake detection", "synthetic detection",
    "media authenticity", "content authentication",
    "AI voice scam", "phone fraud AI", "video call fraud AI",
    "AI-enhanced phishing", "AI-enhanced scam",
    "fake video", "fake audio", "forged video",
]

# ── Secondary / Contextual Keywords ──────────────────────────────────────────
SECONDARY_KEYWORDS = [
    "artificial intelligence", "machine learning",
    "fraud", "scam", "impersonation", "spoofing",
    "disinformation", "misinformation", "manipulation",
    "identity theft", "social engineering", "phishing",
    "cybersecurity", "digital fraud", "synthetic",
    "authentication", "verification", "detection",
    "fake", "forged", "fabricated", "generated",
]

# ── Hard-reject Keywords (only triggers if NO primary hits exist) ─────────────
REJECT_KEYWORDS = [
    "buffer overflow",
    "SQL injection",
    "memory corruption",
    "privilege escalation",
    "remote code execution vulnerability",
    "CVSS score",
    "patch tuesday",
    "kernel exploit",
]

# ── Semantic Anchor for daily retrieval ───────────────────────────────────────
DAILY_REPORT_QUERY = (
    "deepfake attacks voice cloning synthetic identity AI fraud "
    "impersonation scam social engineering biometric spoofing "
    "AI-generated video audio manipulation"
)
