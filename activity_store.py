from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "activity.db"

_lock = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                status TEXT NOT NULL,
                confidence REAL NOT NULL,
                mode TEXT NOT NULL DEFAULT 'Single Upload',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS enhancements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                quality INTEGER NOT NULL,
                noise_reduction INTEGER NOT NULL,
                clarity_boost INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles_completed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_url TEXT NOT NULL UNIQUE,
                article_title TEXT NOT NULL,
                source TEXT,
                completed_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS watermarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                secret_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                report_type TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Write helpers (called right after a real detect/enhance/awareness action)
# ─────────────────────────────────────────────────────────────────────────────

def log_detection(filename: str, status: str, confidence: float, mode: str = "Single Upload") -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO detections (filename, status, confidence, mode, created_at) VALUES (?, ?, ?, ?, ?)",
            (filename, status, float(confidence), mode, _now_iso()),
        )
        conn.commit()


def log_enhancement(filename: str, quality: int, noise_reduction: int, clarity_boost: int) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO enhancements (filename, quality, noise_reduction, clarity_boost, created_at) VALUES (?, ?, ?, ?, ?)",
            (filename, int(quality), int(noise_reduction), int(clarity_boost), _now_iso()),
        )
        conn.commit()


def log_watermark(filename: str, secret_id: str) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO watermarks (filename, secret_id, created_at) VALUES (?, ?, ?)",
            (filename, secret_id, _now_iso()),
        )
        conn.commit()


def log_report(filename: str, report_type: str) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO reports (filename, report_type, created_at) VALUES (?, ?, ?)",
            (filename, report_type, _now_iso()),
        )
        conn.commit()


def set_article_completion(article_url: str, article_title: str, source: str, completed: bool) -> bool:
    """Toggle an awareness article's completion state. Returns the new state."""
    with _lock, _connect() as conn:
        if completed:
            conn.execute(
                """
                INSERT INTO articles_completed (article_url, article_title, source, completed_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(article_url) DO UPDATE SET completed_at = excluded.completed_at
                """,
                (article_url, article_title, source, _now_iso()),
            )
        else:
            conn.execute("DELETE FROM articles_completed WHERE article_url = ?", (article_url,))
        conn.commit()
    return completed


def get_completed_article_urls() -> set[str]:
    with _lock, _connect() as conn:
        rows = conn.execute("SELECT article_url FROM articles_completed").fetchall()
    return {row["article_url"] for row in rows}


# ─────────────────────────────────────────────────────────────────────────────
# Read / analytics helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _score_label(score: int, total: int) -> str:
    if total == 0:
        return "No Data Yet"
    if score >= 850:
        return "Very Secure"
    if score >= 650:
        return "Secure"
    if score >= 400:
        return "Moderate Risk"
    return "High Risk"


def _bucket_edges(start: datetime, end: datetime, buckets: int) -> list[datetime]:
    if buckets < 1:
        buckets = 1
    span = (end - start) / buckets
    return [start + span * i for i in range(buckets + 1)]


def _fmt_bucket_label(dt: datetime, range_days: int) -> str:
    if range_days <= 7:
        return dt.strftime("%a")
    return dt.strftime("%b %d")


def get_summary(range_days: int = 30, intel_report_ready: bool = False) -> dict:
    now = datetime.now(timezone.utc)
    range_start = now - timedelta(days=range_days)

    with _lock, _connect() as conn:
        detection_rows = conn.execute(
            "SELECT filename, status, confidence, mode, created_at FROM detections ORDER BY created_at ASC"
        ).fetchall()
        enhancement_rows = conn.execute(
            "SELECT filename, quality, noise_reduction, clarity_boost, created_at FROM enhancements ORDER BY created_at ASC"
        ).fetchall()
        article_rows = conn.execute(
            "SELECT article_url, article_title, source, completed_at FROM articles_completed ORDER BY completed_at ASC"
        ).fetchall()
        watermark_rows = conn.execute(
            "SELECT filename, secret_id, created_at FROM watermarks ORDER BY created_at ASC"
        ).fetchall()
        report_rows = conn.execute(
            "SELECT filename, report_type, created_at FROM reports ORDER BY created_at ASC"
        ).fetchall()

    detections = [dict(row) for row in detection_rows]
    enhancements = [dict(row) for row in enhancement_rows]
    articles = [dict(row) for row in article_rows]
    watermarks = [dict(row) for row in watermark_rows]
    reports = [dict(row) for row in report_rows]

    for d in detections:
        d["created_dt"] = _parse_iso(d["created_at"])
    for e in enhancements:
        e["created_dt"] = _parse_iso(e["created_at"])
    for a in articles:
        a["completed_dt"] = _parse_iso(a["completed_at"])
    for w in watermarks:
        w["created_dt"] = _parse_iso(w["created_at"])
    for r in reports:
        r["created_dt"] = _parse_iso(r["created_at"])

    total_all = len(detections)
    real_all = sum(1 for d in detections if d["status"] == "Real")
    deepfake_all = sum(1 for d in detections if d["status"] == "Deepfake")
    ai_all = sum(1 for d in detections if d["status"] == "AI Generated")

    range_detections = [d for d in detections if d["created_dt"] >= range_start]
    total_range = len(range_detections)
    real_range = sum(1 for d in range_detections if d["status"] == "Real")
    deepfake_range = sum(1 for d in range_detections if d["status"] == "Deepfake")
    ai_range = sum(1 for d in range_detections if d["status"] == "AI Generated")

    range_enhancements = [e for e in enhancements if e["created_dt"] >= range_start]
    range_articles = [a for a in articles if a["completed_dt"] >= range_start]

    # ── Safety score (all-time ratio of Real vs total) ──
    safety_score = round((real_all / total_all) * 1000) if total_all else 0
    older = [d for d in detections if d["created_dt"] < range_start]
    older_total = len(older)
    older_real = sum(1 for d in older if d["status"] == "Real")
    older_score = round((older_real / older_total) * 1000) if older_total else safety_score
    score_delta = safety_score - older_score if older_total else 0
    score_label = _score_label(safety_score, total_all)

    # ── Sparklines (last up to 12 evenly-spaced buckets across all-time history) ──
    def score_sparkline(buckets: int = 12) -> list[dict]:
        if not detections:
            return [{"v": 0} for _ in range(buckets)]
        start = detections[0]["created_dt"]
        edges = _bucket_edges(start, now, buckets)
        points = []
        running_real, running_total = 0, 0
        cursor = 0
        for i in range(buckets):
            lo, hi = edges[i], edges[i + 1]
            while cursor < len(detections) and detections[cursor]["created_dt"] < hi:
                running_total += 1
                if detections[cursor]["status"] == "Real":
                    running_real += 1
                cursor += 1
            score = round((running_real / running_total) * 100) if running_total else 0
            points.append({"v": score})
        return points

    def threat_sparkline(buckets: int = 12) -> list[dict]:
        if not detections:
            return [{"v": 0} for _ in range(buckets)]
        start = detections[0]["created_dt"]
        edges = _bucket_edges(start, now, buckets)
        points = []
        for i in range(buckets):
            lo, hi = edges[i], edges[i + 1]
            count = sum(1 for d in detections if lo <= d["created_dt"] < hi and d["status"] in ("Deepfake", "AI Generated"))
            points.append({"v": count})
        return points

    # ── Trend chart: Real / Deepfake / AI per bucket within the selected range ──
    bucket_count = 7 if range_days <= 7 else 10 if range_days <= 30 else 12
    edges = _bucket_edges(range_start, now, bucket_count)
    trend = []
    for i in range(bucket_count):
        lo, hi = edges[i], edges[i + 1]
        bucket_ds = [d for d in range_detections if lo <= d["created_dt"] < hi]
        trend.append({
            "label": _fmt_bucket_label(hi, range_days),
            "real": sum(1 for d in bucket_ds if d["status"] == "Real"),
            "deepfake": sum(1 for d in bucket_ds if d["status"] == "Deepfake"),
            "ai": sum(1 for d in bucket_ds if d["status"] == "AI Generated"),
        })

    files_enhanced_all = len(enhancements)
    files_enhanced_range = len(range_enhancements)
    avg_confidence = round(sum(d["confidence"] for d in detections) / total_all) if total_all else 0
    enhancement_coverage = round((files_enhanced_all / total_all) * 100) if total_all else 0
    awareness_completed = len(articles)
    awareness_engagement = min(100, awareness_completed * 10)
    intel_pipeline_health = 100 if intel_report_ready else 0

    # ── Unified activity log (most recent first) ──
    log_rows = []
    for d in detections:
        if d["status"] == "Real":
            classification, status_key = "Authentic (Logged)", "authentic"
            action = "Legal redirection" if d["confidence"] >= 97 else "None"
        elif d["status"] == "Deepfake":
            classification, status_key, action = "Deepfake (Blocked)", "deepfake", "Reported to Security"
        else:
            classification, status_key, action = "Suspicious (Review)", "suspicious", "Flagged for Review"
        log_rows.append({
            "source": f"{d['filename']} ({d['mode']})",
            "classification": classification,
            "status": status_key,
            "action": action,
            "confidence": f"{round(d['confidence'])}%",
            "timestamp": d["created_at"],
            "sortKey": d["created_at"],
        })
    for e in enhancements:
        log_rows.append({
            "source": f"{e['filename']} (Enhancement)",
            "classification": "Enhanced (Enhanced)",
            "status": "enhanced",
            "action": "Quality Enhanced",
            "confidence": f"{e['quality']}% quality",
            "timestamp": e["created_at"],
            "sortKey": e["created_at"],
        })
    for a in articles:
        log_rows.append({
            "source": a["article_title"],
            "classification": "Awareness Article Completed",
            "status": "awareness",
            "action": "Reviewed",
            "confidence": "-",
            "timestamp": a["completed_at"],
            "sortKey": a["completed_at"],
        })
    for w in watermarks:
        log_rows.append({
            "source": f"{w['filename']} (Watermarked)",
            "classification": "Audio Watermarked",
            "status": "authentic",
            "action": "Embedded ID",
            "confidence": f"ID: {w['secret_id'][:6]}...",
            "timestamp": w["created_at"],
            "sortKey": w["created_at"],
        })
    for r in reports:
        log_rows.append({
            "source": f"{r['filename']} ({r['report_type']})",
            "classification": "Report Generated",
            "status": "suspicious",
            "action": "Generated",
            "confidence": "-",
            "timestamp": r["created_at"],
            "sortKey": r["created_at"],
        })
    log_rows.sort(key=lambda r: r["sortKey"], reverse=True)
    for row in log_rows:
        row.pop("sortKey", None)

    return {
        "totals": {
            "totalAnalyzed": total_all,
            "real": real_all,
            "deepfake": deepfake_all,
            "aiGenerated": ai_all,
            "totalAnalyzedInRange": total_range,
            "realInRange": real_range,
            "deepfakeInRange": deepfake_range,
            "aiGeneratedInRange": ai_range,
            "filesEnhanced": files_enhanced_all,
            "filesEnhancedInRange": files_enhanced_range,
            "awarenessArticlesCompleted": awareness_completed,
            "awarenessArticlesCompletedInRange": len(range_articles),
            "averageConfidence": avg_confidence,
        },
        "safetyScore": {
            "value": safety_score,
            "max": 1000,
            "label": score_label,
            "deltaPercent": score_delta,
            "sparkline": score_sparkline(),
        },
        "threatPrevention": {
            "blocked": deepfake_all + ai_all,
            "blockedInRange": deepfake_range + ai_range,
            "sparkline": threat_sparkline(),
        },
        "enhancement": {
            "count": files_enhanced_all,
            "coveragePercent": enhancement_coverage,
        },
        "upgrades": [
            {"name": "Detection Confidence", "value": avg_confidence},
            {"name": "Enhancement Coverage", "value": enhancement_coverage},
            {"name": "Awareness Engagement", "value": awareness_engagement},
            {"name": "Intel Pipeline Health", "value": intel_pipeline_health},
        ],
        "trend": trend,
        "activityLog": log_rows[:50],
        "rangeDays": range_days,
    }


def get_completed_articles() -> list[dict]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT article_url, article_title, source, completed_at FROM articles_completed ORDER BY completed_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


init_db()
