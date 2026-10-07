"""
utils/logger.py - FIXED v2
Fixed: loguru and stdlib logging co-exist cleanly.
APScheduler uses stdlib logging; we bridge it to loguru.
"""

import sys
import logging
from loguru import logger
from pathlib import Path


def setup_logger(log_dir: Path, log_level: str = "INFO"):
    logger.remove()

    # Console
    logger.add(
        sys.stdout,
        level=log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan> - <level>{message}</level>"
        ),
        colorize=True,
    )

    # Rotating file
    logger.add(
        str(log_dir / "system_{time:YYYY-MM-DD}.log"),
        level="DEBUG",
        rotation="00:00",
        retention="14 days",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name} - {message}",
    )

    # Bridge stdlib logging -> loguru (for APScheduler, chromadb, etc.)
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno
            frame, depth = sys._getframe(6), 6
            while frame and frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1
            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    return logger


# Initialise once on import
import os
from pathlib import Path as _Path
_log_dir = _Path(__file__).parent.parent / "data" / "logs"
_log_dir.mkdir(parents=True, exist_ok=True)
_level = os.getenv("LOG_LEVEL", "INFO")
log = setup_logger(_log_dir, _level)
