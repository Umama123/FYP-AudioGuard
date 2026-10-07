"""
scheduler/daily_scheduler.py - v2
APScheduler daily automation + CLI pipeline runner.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

from config import DAILY_RUN_TIME, MAX_ARTICLES_PER_RUN
from ingestion.scraper import ingest_all_sources
from filtering.relevance_filter import filter_articles
from embedding.vector_store import embed_and_store, db_stats
from reporting.report_generator import generate_report
from utils.logger import log

console = Console()


def run_pipeline(print_report: bool = True) -> None:
    start = datetime.now()
    console.rule("[bold cyan] Aware & Sincere - Pipeline Start[/bold cyan]")

    # Stage 1 - Ingest
    console.print("[bold]Stage 1/4[/bold]  Ingesting sources…")
    raw = ingest_all_sources()
    console.print(f"   {len(raw)} raw articles fetched")

    # Stage 2 - Filter
    console.print("[bold]Stage 2/4[/bold]  Filtering for deepfake relevance…")
    filtered = filter_articles(raw)
    console.print(f"   {len(filtered)} articles passed relevance filter")

    if not filtered:
        console.print(
            "[yellow]    0 relevant articles found.\n"
            "  Tip: Lower MIN_RELEVANCE_SCORE in .env (currently set in config.py as 0.10)[/yellow]"
        )
        return

    # Stage 3 - Embed
    console.print("[bold]Stage 3/4[/bold]  Embedding into ChromaDB…")
    stored = embed_and_store(filtered[:MAX_ARTICLES_PER_RUN])
    stats  = db_stats()
    console.print(f"   {stored} new | DB total: {stats['total_documents']}")

    # Stage 4 - Report
    console.print("[bold]Stage 4/4[/bold]  Generating intelligence report…")
    report_md, report_path = generate_report()
    console.print(f"   Report -> [bold green]{report_path}[/bold green]")

    elapsed = (datetime.now() - start).total_seconds()
    console.rule("[bold green] Pipeline Complete[/bold green]")

    t = Table(box=box.ROUNDED, header_style="bold cyan")
    t.add_column("Metric",  style="cyan")
    t.add_column("Value",   style="green")
    t.add_row("Raw articles",       str(len(raw)))
    t.add_row("Passed filter",      str(len(filtered)))
    t.add_row("Newly stored",       str(stored))
    t.add_row("DB total",           str(stats["total_documents"]))
    t.add_row("Report path",        str(report_path))
    t.add_row("Duration",           f"{elapsed:.1f}s")
    console.print(t)

    if print_report:
        console.rule("[bold magenta] Report Preview (first 80 lines)[/bold magenta]")
        lines = report_md.splitlines()
        console.print("\n".join(lines[:80]))
        if len(lines) > 80:
            console.print(f"\n[dim]… {len(lines)-80} more lines in {report_path}[/dim]")


def start_scheduler() -> None:
    hour, minute = DAILY_RUN_TIME.split(":")
    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_pipeline,
        trigger=CronTrigger(hour=int(hour), minute=int(minute)),
        id="daily_deepfake_intel",
        name="Daily Deepfake Intelligence",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    console.print(Panel(
        f"[bold cyan]Aware & Sincere Scheduler[/bold cyan]\n"
        f"Daily run at [bold]{DAILY_RUN_TIME} UTC[/bold]\n"
        f"Press Ctrl+C to stop.",
        title=" Scheduler", border_style="cyan",
    ))
    log.info(f"Scheduler started - daily at {DAILY_RUN_TIME} UTC")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Scheduler stopped")
        console.print("\n[yellow]Stopped.[/yellow]")
