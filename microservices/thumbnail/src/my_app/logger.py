import logging
import sys

LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARN": logging.WARNING,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
}


logger = logging.getLogger("thumbnail")

handler = logging.StreamHandler(sys.stdout)

formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

handler.setFormatter(formatter)

logger.addHandler(handler)

logger.propagate = False


def configure(level="INFO"):
    """Sets the logger's log level."""
    logger.setLevel(LOG_LEVELS.get(level.upper(), logging.INFO))


def get_current_level() -> str:
    """Returns the name of the current log level (e.g. 'INFO', 'DEBUG')."""
    return logging.getLevelName(logger.getEffectiveLevel())
