import argparse
import logging
import sys

from providers import generate_new_providers, save_providers
from config import (
    OUTPUT_PROVIDERS_FILE,
    OUTPUT_DIR,
    LOG_FILE,
)


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8"),
        ],
    )


def main():
    parser = argparse.ArgumentParser(
        description="Generate new providers with Google Gemini."
    )
    parser.add_argument(
        "--max-categories",
        type=int,
        default=None,
        help="Limit processing to the first N categories (useful for testing).",
    )
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    setup_logging()

    logger = logging.getLogger(__name__)

    logger.info("Starting provider generator...")

    try:
        providers = generate_new_providers(max_categories=args.max_categories)
    except KeyboardInterrupt:
        logger.info(
            "Interrupted. Progress is saved incrementally to %s.",
            OUTPUT_PROVIDERS_FILE,
        )
        raise SystemExit(130)

    # Final safety write (the generator also saves after every category).
    save_providers(providers)

    logger.info("Done!")
    logger.info("Wrote %d providers to %s", len(providers), OUTPUT_PROVIDERS_FILE)


if __name__ == "__main__":
    main()
