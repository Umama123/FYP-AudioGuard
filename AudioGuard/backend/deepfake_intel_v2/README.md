#  Aware & Sincere - Real-Time Deepfake Intelligence System  v2

> RAG-powered daily deepfake threat brief. Zero hallucinations. Real citations only.

---

## ⚡ Quick Start (5 commands)

```bash
# 1. Create & activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy config (edit NEWS_API_KEY if you have one - optional)
cp .env.example .env

# 4. Run the full pipeline ONCE
python main.py run

# 5. To run automatically every day at 07:00 UTC
python main.py schedule
```

---

## 📁 Project Structure

```
deepfake_intel/
├── main.py                      ← CLI entry point
├── config.py                    ← All settings + keyword lists
├── requirements.txt
├── .env.example                 ← Copy to .env
│
├── ingestion/
│   └── scraper.py               ← 11 RSS feeds + async body fetch + NewsAPI
│
├── filtering/
│   └── relevance_filter.py      ← 4-stage keyword+semantic scoring
│
├── embedding/
│   └── vector_store.py          ← ChromaDB embed / store / retrieve
│
├── retrieval/
│   └── clustering.py            ← 8-theme article clustering
│
├── reporting/
│   └── report_generator.py      ← Daily Markdown brief (extraction only)
│
├── scheduler/
│   └── daily_scheduler.py       ← APScheduler daily automation
│
├── utils/
│   ├── logger.py                ← Loguru + stdlib bridge
│   └── text_utils.py            ← HTML strip, hashing
│
└── data/
    ├── chroma_db/               ← Persistent vector store (auto-created)
    ├── reports/                 ← Daily .md reports (auto-created)
    └── logs/                    ← Rotating logs (auto-created)
```

---

## 🐛 Bugs Fixed in v2

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **0/165 articles passed filter** | `MIN_RELEVANCE_SCORE=0.35` was too high; semantic scoring of short news snippets rarely exceeds 0.30 | Lowered to `0.10`; composite formula rebalanced to 60% keyword / 40% semantic |
| **Ars Technica 0 entries** | RSS URL `/arstechnica/security` returns invalid XML | Switched to `/arstechnica/technology-lab` |
| **Sophos 0 entries** | `nakedsecurity.sophos.com` feed retired | Updated to `news.sophos.com/en-us/feed/` |
| **ChromaDB telemetry error** | `Settings(anonymized_telemetry=False)` deprecated in 0.4.x | Use env var `ANONYMIZED_TELEMETRY=False` instead |
| **Body fetch discarded on fail** | `article["body"]` was blanked on timeout | Now falls back to RSS summary/content field |
| **Stdlib log noise** | APScheduler & chromadb use `logging.*` which conflicted with loguru | Added `InterceptHandler` bridge in `logger.py` |

---

## 🏗️ Architecture

```
RSS Feeds (11 sources)
       │
       ▼
  [Ingestion]  feedparser + aiohttp async body fetch
       │
       ▼
  [Filter]     Stage 1: hard-reject   (pure noise)
               Stage 2: keyword score (PRIMARY × 0.12 + SECONDARY × 0.04)
               Stage 3: semantic score (MiniLM cosine vs deepfake anchor)
               Stage 4: composite = 0.60×keyword + 0.40×semantic ≥ 0.10
       │
       ▼
  [Embed]      all-MiniLM-L6-v2 -> ChromaDB (cosine index, persistent)
       │
       ▼
  [Retrieve]   Semantic query + recency blending (70% sim + 30% recency)
       │
       ▼
  [Cluster]    8 thematic anchors -> cosine assignment
       │
       ▼
  [Report]     Extraction-only Markdown brief with real citations
       │
       ▼
  data/reports/deepfake_intel_YYYY-MM-DD.md
```

---

## 🚀 All Commands

| Command | What it does |
|---------|-------------|
| `python main.py run` | Full pipeline: ingest -> filter -> embed -> report |
| `python main.py schedule` | Start 24h scheduler (blocking, Ctrl+C to stop) |
| `python main.py report` | Enhance report from existing DB |
| `python main.py ingest` | Ingest + embed only (no report) |
| `python main.py stats` | Show DB document count and path |

---

## ⚙️ Configuration (`.env`)

| Key | Default | Notes |
|-----|---------|-------|
| `MIN_RELEVANCE_SCORE` | `0.10` | Lower = more articles pass. Start here, raise to 0.20 max |
| `MAX_ARTICLES_PER_RUN` | `150` | Cap on articles embedded per run |
| `TOP_K_RETRIEVAL` | `20` | Articles pulled for report generation |
| `DAILY_RUN_TIME` | `07:00` | UTC time for daily scheduler |
| `NEWS_API_KEY` | *(empty)* | Optional. Get free key at newsapi.org |
| `LOG_LEVEL` | `INFO` | Set to `DEBUG` to see per-article scores |

---

## 🔧 Troubleshooting

**Still 0 articles passing?**
```bash
# Debug mode shows per-article scores
LOG_LEVEL=DEBUG python main.py run 2>&1 | head -100
```

**ChromaDB error on startup?**
```bash
rm -rf data/chroma_db/   # wipe DB and start fresh
python main.py run
```

**RSS feed warnings (bozo)?**
These are harmless - feedparser still extracts entries from imperfect XML.

---

*Aware & Sincere - Real citations. No hallucinations. No sponsored content.*
