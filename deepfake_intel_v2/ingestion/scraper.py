"""
ingestion/scraper.py  - FIXED v2
─────────────────────────────────
Fixes:
  1. Added robust fallback: if async body fetch fails, use RSS summary
  2. Better date parsing with multiple fallback strategies
  3. Handles bozo feeds gracefully (Krebs HTML feed, Sophos)
  4. Added timeout and connection error handling per-feed
  5. Body text now built from summary if full fetch fails
"""

import time
import asyncio
import aiohttp
import feedparser
import requests
from datetime import datetime, timezone
from typing import Optional
from dateutil import parser as dateparser

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import RSS_FEEDS, NEWS_API_KEY
from utils.text_utils import strip_html, truncate, url_fingerprint
from utils.logger import log

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; AwareSincereBot/1.0)"
    )
}
FETCH_TIMEOUT  = 12
MAX_BODY_CHARS = 3000


def _parse_date(entry) -> str:
    for field in ("published_parsed", "updated_parsed"):
        t = getattr(entry, field, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                pass
    for field in ("published", "updated"):
        raw = getattr(entry, field, None)
        if raw:
            try:
                return dateparser.parse(raw).astimezone(timezone.utc).isoformat()
            except Exception:
                pass
    return datetime.now(timezone.utc).isoformat()


def fetch_rss_feed(feed_cfg: dict) -> list[dict]:
    articles = []
    try:
        # feedparser handles bozo gracefully - we just log and continue
        parsed = feedparser.parse(
            feed_cfg["url"],
            request_headers=HEADERS,
            agent=HEADERS["User-Agent"],
        )

        for entry in parsed.entries:
            link = getattr(entry, "link", "") or ""
            if not link:
                continue

            title = strip_html(getattr(entry, "title", "") or "")
            summary = strip_html(
                getattr(entry, "summary", "")
                or getattr(entry, "description", "")
                or getattr(entry, "content", [{}])[0].get("value", "") if hasattr(entry, "content") and entry.content else ""
                or ""
            )

            # Use content field if available (richer than summary)
            content_val = ""
            if hasattr(entry, "content") and entry.content:
                content_val = strip_html(entry.content[0].get("value", ""))

            body_text = truncate(content_val or summary, MAX_BODY_CHARS)

            articles.append({
                "title":    title,
                "url":      link,
                "url_hash": url_fingerprint(link),
                "source":   feed_cfg["name"],
                "priority": feed_cfg.get("priority", 2),
                "date":     _parse_date(entry),
                "summary":  truncate(summary, 800),
                "body":     body_text,   # pre-filled from RSS; enriched later
                "tags":     [t.get("term", "") for t in getattr(entry, "tags", [])],
            })

        log.info(f"[{feed_cfg['name']}] {len(articles)} entries")
    except Exception as e:
        log.error(f"[{feed_cfg['name']}] RSS error: {e}")
    return articles


async def _fetch_body(session: aiohttp.ClientSession, article: dict) -> dict:
    """Fetch full page body. Falls back to existing body on failure."""
    try:
        async with session.get(
            article["url"],
            headers=HEADERS,
            timeout=aiohttp.ClientTimeout(total=FETCH_TIMEOUT),
            ssl=False,
            allow_redirects=True,
        ) as resp:
            if resp.status == 200:
                html = await resp.text(errors="replace")
                fetched = truncate(strip_html(html), MAX_BODY_CHARS)
                # Only replace if we got meaningful content
                if len(fetched) > len(article.get("body", "")):
                    article["body"] = fetched
    except Exception as e:
        log.debug(f"Body fetch failed ({article['url'][:60]}): {e}")
        # Keep whatever body we already have from RSS
    return article


async def _enrich_articles(articles: list[dict]) -> list[dict]:
    conn = aiohttp.TCPConnector(limit=8, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as session:
        tasks   = [_fetch_body(session, a) for a in articles]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


def fetch_newsapi(query: str = "deepfake AI fraud synthetic media voice cloning") -> list[dict]:
    if not NEWS_API_KEY:
        return []
    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 30,
                "apiKey": NEWS_API_KEY,
            },
            timeout=10,
        )
        data = resp.json()
        articles = []
        for item in data.get("articles", []):
            url = item.get("url", "")
            if not url or "removed.com" in url:
                continue
            articles.append({
                "title":    item.get("title", ""),
                "url":      url,
                "url_hash": url_fingerprint(url),
                "source":   item.get("source", {}).get("name", "NewsAPI"),
                "priority": 2,
                "date":     item.get("publishedAt", datetime.now(timezone.utc).isoformat()),
                "summary":  truncate(strip_html(item.get("description", "") or ""), 800),
                "body":     truncate(strip_html(item.get("content", "") or ""), MAX_BODY_CHARS),
                "tags":     [],
            })
        log.info(f"[NewsAPI] {len(articles)} articles")
        return articles
    except Exception as e:
        log.error(f"[NewsAPI] {e}")
        return []


def ingest_all_sources() -> list[dict]:
    """Master ingestion: RSS + NewsAPI -> dedup -> async body enrichment."""
    raw: list[dict] = []

    for feed_cfg in RSS_FEEDS:
        raw.extend(fetch_rss_feed(feed_cfg))
        time.sleep(0.2)

    raw.extend(fetch_newsapi())

    # URL-level dedup
    seen: set[str] = set()
    unique: list[dict] = []
    for a in raw:
        h = a["url_hash"]
        if h not in seen:
            seen.add(h)
            unique.append(a)

    log.info(f"Unique articles after dedup: {len(unique)}")

    # Async body enrichment (improves content for scoring)
    enriched = asyncio.run(_enrich_articles(unique))
    log.info(f"Enrichment complete: {len(enriched)} articles")
    return enriched
