"""
main.py - Aware & Sincere CLI Entry Point v2

Usage:
  python main.py run        -> Full pipeline once (ingest + filter + embed + report)
  python main.py schedule   -> Start daily scheduler
  python main.py report     -> Report from existing DB (no re-ingest)
  python main.py stats      -> DB statistics
  python main.py ingest     -> Ingest + filter + embed only
"""

import sys
import os

# Ensure project root is on path regardless of where you call from
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rich.console import Console
from rich.panel import Panel

console = Console()

BANNER = """[bold cyan]
 █████╗ ██╗    ██╗ █████╗ ██████╗ ███████╗
██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔════╝
███████║██║ █╗ ██║███████║██████╔╝█████╗
██╔══██║██║███╗██║██╔══██║██╔══██╗██╔══╝
██║  ██║╚███╔███╔╝██║  ██║██║  ██║███████╗
╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝[/bold cyan]
[bold white]   Real-Time Deepfake Intelligence System - v2[/bold white]
[dim]   Aware & Sincere | RAG-Powered | Zero Hallucinations[/dim]
"""


def cmd_run():
    from scheduler.daily_scheduler import run_pipeline
    run_pipeline(print_report=True)

def cmd_schedule():
    from scheduler.daily_scheduler import start_scheduler
    start_scheduler()

def cmd_report():
    from reporting.report_generator import generate_report
    console.print("[cyan]Generating report from existing vector store…[/cyan]")
    report_md, path = generate_report()
    console.print(f"[green] Saved -> {path}[/green]\n")
    console.print("\n".join(report_md.splitlines()[:70]))

def cmd_stats():
    from embedding.vector_store import db_stats
    from rich.table import Table
    from rich import box
    stats = db_stats()
    t = Table(title=" Vector DB Stats", box=box.ROUNDED, header_style="bold cyan")
    t.add_column("Key",   style="cyan")
    t.add_column("Value", style="green")
    for k, v in stats.items():
        t.add_row(k.replace("_"," ").title(), str(v))
    console.print(t)

def cmd_ingest():
    from config import MAX_ARTICLES_PER_RUN
    from ingestion.scraper import ingest_all_sources
    from filtering.relevance_filter import filter_articles
    from embedding.vector_store import embed_and_store, db_stats
    raw      = ingest_all_sources()
    filtered = filter_articles(raw)
    stored   = embed_and_store(filtered[:MAX_ARTICLES_PER_RUN])
    stats    = db_stats()
    console.print(f"[green] {stored} new articles stored. DB total: {stats['total_documents']}[/green]")

COMMANDS = {
    "run":      cmd_run,
    "schedule": cmd_schedule,
    "report":   cmd_report,
    "stats":    cmd_stats,
    "ingest":   cmd_ingest,
}

def main():
    console.print(BANNER)
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        console.print(Panel(
            "\n".join([
                "[bold]Commands:[/bold]",
                "",
                "  [cyan]python main.py run[/cyan]       - Full pipeline (ingest -> filter -> embed -> report)",
                "  [cyan]python main.py schedule[/cyan]  - Daily scheduler (runs every 24 h)",
                "  [cyan]python main.py report[/cyan]    - Report from existing DB",
                "  [cyan]python main.py stats[/cyan]     - Show DB statistics",
                "  [cyan]python main.py ingest[/cyan]    - Ingest + store only",
            ]),
            title="📖 Usage", border_style="cyan",
        ))
        sys.exit(0)
    COMMANDS[sys.argv[1]]()

if __name__ == "__main__":
    main()
