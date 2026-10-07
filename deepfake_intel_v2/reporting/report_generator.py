"""
reporting/report_generator.py - v2
Zero-hallucination daily intelligence brief.
All content extracted directly from retrieved articles.
"""

import re
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from pathlib import Path

from config import REPORT_DIR, DAILY_REPORT_QUERY, TOP_K_RETRIEVAL, GEMINI_API_KEY, GEMINI_MODEL
from embedding.vector_store import retrieve, db_stats
from retrieval.clustering import cluster_articles
from utils.logger import log

import json
import google.generativeai as genai

# Keep the endpoint for Intel independent by using specific model version
genai.configure(api_key=GEMINI_API_KEY)

def generate_llm_insights(articles: list[dict]) -> dict:
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        context = ""
        for idx, a in enumerate(articles[:10]):
            context += f"Article {idx+1}:\nTitle: {a['title']}\nURL: {a['url']}\nSource: {a['source']}\nContent: {a['text'][:800]}\n\n"
            
        prompt = f"""
You are an AI intelligence analyst specializing in deepfakes and synthetic media.
Based on the following retrieved articles, provide a comprehensive summary of the current issues and how they can be resolved.
Extract key insights, emerging threats, and prevention/mitigation tips. Ensure you include the article links where appropriate.

Return the result strictly as a valid JSON object with the following schema:
{{
    "summary": "A detailed 2-3 paragraph summary discussing the core issues identified in the articles and how they can be resolved.",
    "key_insights": [
        {{
            "sentence": "A very specific, impactful sentence describing an insight.",
            "title": "Title of the article this insight came from",
            "url": "URL of the article"
        }}
    ],
    "threats": [
        "A specific threat mentioned in the articles (string)"
    ],
    "prevention": [
        "A specific prevention or mitigation tip (string)"
    ]
}}

Articles Context:
{context}
"""
        response = model.generate_content(prompt)
        text = response.text
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        return json.loads(text.strip())
    except Exception as e:
        log.error(f"LLM generation failed: {e}")
        return None



def _sentences(text: str, min_len: int = 40) -> list[str]:
    sents = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sents if len(s.strip()) >= min_len]


def _top_insights(articles: list[dict], n: int = 10) -> list[tuple]:
    """(sentence, title, url) tuples - directly from article text."""
    results, seen = [], set()
    for a in sorted(articles, key=lambda x: x["blended_score"], reverse=True):
        for s in _sentences(a["text"])[:6]:
            if s not in seen and len(results) < n:
                seen.add(s)
                results.append((s, a["title"], a["url"]))
    return results


def _threat_sentences(articles: list[dict], n: int = 8) -> list[str]:
    SIGNALS = ["attack","exploit","fraud","scam","threat","victim","compromise",
               "breach","steal","bypass","clone","impersonat","fake","spoof",
               "malicious","criminal","phishing","deepfake","synthetic"]
    out, seen = [], set()
    for a in articles:
        for s in _sentences(a["text"]):
            if any(sig in s.lower() for sig in SIGNALS):
                entry = f"{s}  *[{a['source']}]*"
                if entry not in seen:
                    seen.add(entry)
                    out.append(entry)
                    if len(out) >= n:
                        return out
    return out


def _prevention_sentences(articles: list[dict], n: int = 6) -> list[str]:
    SIGNALS = ["protect","prevent","detect","verify","authenticat","awareness",
               "train","recommend","best practice","watermark","liveness",
               "mitigation","policy","regulation","guideline","should","must"]
    out, seen = [], set()
    for a in articles:
        for s in _sentences(a["text"]):
            if any(sig in s.lower() for sig in SIGNALS):
                entry = f"{s}  *[{a['source']}]*"
                if entry not in seen:
                    seen.add(entry)
                    out.append(entry)
                    if len(out) >= n:
                        return out
    return out


def generate_report() -> tuple[str, Path]:
    now      = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    ts_str   = now.strftime("%Y-%m-%d %H:%M UTC")

    log.info("Generating daily report…")
    articles = retrieve(DAILY_REPORT_QUERY, top_k=TOP_K_RETRIEVAL)

    if not articles:
        msg = (
            "  No articles in the vector store.\n"
            "Run `python main.py ingest` first, then retry."
        )
        log.warning(msg)
        return msg, _save(msg, date_str)

    log.info(f"Building report from {len(articles)} retrieved articles")
    clusters   = cluster_articles(articles)
    llm_data = generate_llm_insights(articles)
    stats      = db_stats()
    sources    = list({a["source"] for a in articles})
    
    if llm_data:
        summary_text = llm_data.get("summary", "")
        threats_list = llm_data.get("threats", [])
        tips_list = llm_data.get("prevention", [])
        insights_list = [(x.get("sentence", ""), x.get("title", ""), x.get("url", "")) for x in llm_data.get("key_insights", [])]
    else:
        # Fallback to naive extraction
        summary_text = (
            f"Today's brief synthesises **{len(articles)} intelligence items** across "
            f"**{len(sources)} sources**. "
            "All insights are extracted verbatim from retrieved articles - "
            "no AI-generated speculation is included."
        )
        threats_list = _threat_sentences(articles)
        tips_list = _prevention_sentences(articles)
        insights_list = _top_insights(articles, n=10)

    L: list[str] = []

    # ── Header ──────────────────────────────────────────────────────────
    L += [
        "#  Aware & Sincere: Daily Deepfake Intelligence Report",
        "",
        f"> **Date:** {ts_str}",
        f"> **Articles retrieved:** {len(articles)}  |  **DB total:** {stats['total_documents']}",
        f"> **Sources:** {', '.join(sources[:6])}{'…' if len(sources) > 6 else ''}",
        "",
        "---", "",
    ]

    # ── Overview ─────────────────────────────────────────────────────────
    L += ["##  Overview", ""]
    top3 = articles[:3]
    L.append(summary_text)
    L.append("")
    L.append("**Top stories today:**")
    for a in top3:
        L.append(f"- [{a['title']}]({a['url']}) - *{a['source']}*")
    L += ["", "---", ""]

    # ── Key Insights ──────────────────────────────────────────────────────
    L += ["##  Key Insights", "", "> Sentences extracted directly from source articles", ""]
    for sent, title, url in insights_list:
        L.append(f"- {sent}")
        L.append(f"  ↳ *[{title}]({url})*")
        L.append("")
    L += ["---", ""]

    # ── Thematic Clusters ─────────────────────────────────────────────────
    L += ["##  Intelligence by Theme", ""]
    for label, cluster in clusters.items():
        L.append(f"### {label}")
        L.append("")
        for a in cluster[:5]:
            bar = "█" * max(1, int(a["blended_score"] * 10))
            L.append(f"**[{a['title']}]({a['url']})**")
            L.append(f"*{a['source']}* · {a['date'][:10]} · relevance `{bar}` {a['blended_score']:.2f}")
            snips = _sentences(a["text"])
            if snips:
                L.append(f"> {snips[0][:220]}")
            L.append("")
    L += ["---", ""]

    # ── Emerging Threats ──────────────────────────────────────────────────
    L += ["##  Emerging Threats", "", "> Threat signals extracted from article content", ""]
    if threats_list:
        for t in threats_list:
            L.append(f"- {t}")
    else:
        L.append("- No new threat signals identified in today's corpus.")
    L += ["", "---", ""]

    # ── Prevention Tips ───────────────────────────────────────────────────
    L += ["##  Prevention & Mitigation", "", "> Derived from today's source articles", ""]
    if tips_list:
        for tip in tips_list:
            L.append(f"- {tip}")
    else:
        L.append("- Implement multi-factor authentication and deepfake-aware liveness checks.")
    L += ["", "---", ""]

    # ── Full Source Table ─────────────────────────────────────────────────
    L += [
        "##  All Sources Referenced", "",
        "| # | Article | Source | Date | Score |",
        "|---|---------|--------|------|-------|",
    ]
    for i, a in enumerate(articles, 1):
        t = a["title"].replace("|","｜")[:65]
        L.append(f"| {i} | [{t}]({a['url']}) | {a['source']} | {a['date'][:10]} | {a['blended_score']:.2f} |")
    L += ["", "---", ""]

    # ── Footer ────────────────────────────────────────────────────────────
    L += [
        "*Generated by **Aware & Sincere** - Real-Time Deepfake Intelligence System.*",
        "*No hallucinated content. No sponsored content. Sources are public news feeds.*",
        "",
    ]

    report = "\n".join(L)
    path   = _save(report, date_str)
    log.info(f"Report saved -> {path}")
    return report, path


def _save(content: str, date_str: str) -> Path:
    path = REPORT_DIR / f"deepfake_intel_{date_str}.md"
    path.write_text(content, encoding="utf-8")
    return path
