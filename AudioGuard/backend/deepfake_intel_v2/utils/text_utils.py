"""
utils/text_utils.py - v2
HTML stripping, normalisation, deduplication helpers.
"""

import re
import hashlib
from bs4 import BeautifulSoup


def strip_html(raw: str) -> str:
    if not raw:
        return ""
    try:
        soup = BeautifulSoup(raw, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator=" ")
    except Exception:
        # Fallback: crude regex strip
        text = re.sub(r"<[^>]+>", " ", raw)
    return normalise_whitespace(text)


def normalise_whitespace(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def truncate(text: str, max_chars: int = 2000) -> str:
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_space = truncated.rfind(" ")
    return (truncated[:last_space] + "…") if last_space > 0 else truncated


def url_fingerprint(url: str) -> str:
    url = url.strip().lower().rstrip("/")
    url = re.sub(r"\?.*$", "", url)
    url = re.sub(r"#.*$",  "", url)
    return hashlib.md5(url.encode()).hexdigest()


def text_fingerprint(text: str) -> str:
    snippet = normalise_whitespace(text)[:500].lower()
    return hashlib.md5(snippet.encode()).hexdigest()
