import logging
import sys

LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARN": logging.WARNING,
    "ERROR": logging.ERROR,
}


logger = logging.getLogger("thumbnail")

handler = logging.StreamHandler(sys.stdout)

formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

handler.setFormatter(formatter)

logger.addHandler(handler)

logger.propagate = False


def configure(level="INFO"):
    logger.setLevel(LOG_LEVELS.get(level.upper(), logging.INFO))
